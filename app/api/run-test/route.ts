import { createClient } from '../../utils/supabase/server';
import { NextResponse } from 'next/server';
import { generatePrompts } from '../../lib/prompt-generator';
import { StartScanSchema } from '../../lib/validators';
import { z } from 'zod';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));

        // 0. Check & Reset Billing Cycle
        await supabase.rpc('check_and_reset_usage', { user_id: user.id });

        // 1. Validation
        const { includeCompetitors, basePrompt, variationCount } = await StartScanSchema.parseAsync(body);

        // 2. Fetch User Profile & Plan
        let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            throw new Error('User profile not found. Please complete settings first.');
        }

        const userPlanId = profile.plan || 'free';
        const { data: planData } = await supabase
            .from('plans')
            .select('monthly_credit_limit_usd, features, requests_per_hour')
            .eq('id', userPlanId)
            .single();

        const limit = planData?.monthly_credit_limit_usd || 0.25;
        const planFeatures = planData?.features || [];
        const hourlyLimit = planData?.requests_per_hour || 10;

        // 3. Rate Limiting
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: recentRuns, error: rateError } = await supabase
            .from('test_runs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', oneHourAgo);

        if (rateError) console.error('Rate limit check failed', rateError);

        if ((recentRuns || 0) >= hourlyLimit) {
            return NextResponse.json({
                error: `Rate limit exceeded. Your plan allows ${hourlyLimit} scans per hour.`
            }, { status: 429 });
        }

        // 4. Usage & Cost Calculation
        const currentUsage = profile.credits_used || 0;
        const selectedModelIds: string[] = profile.selected_models || [
            'openai/gpt-4o', 'google/gemini-1.5-pro', 'anthropic/claude-3-5-sonnet'
        ];

        // Determine number of prompts per model
        // If basePrompt is set, we use variationCount. Otherwise, we use default static set (3).
        const promptsPerModel = basePrompt ? variationCount : 3;

        // Multiplier for competitors
        const competitorData = profile.competitors || [];
        const competitorCount = (includeCompetitors && competitorData.length > 0) ? Math.min(competitorData.length, 3) : 0;

        // Total Checks = (1 self + N competitors) * Models * Prompts
        // Cost = Total Checks * CostPerCheck (approx $0.10)
        // We'll estimate cost here for basic validation, though real cost is tracked on result insert/update usually or assumed fixed.
        // Assuming fairly standard cost per check for simplicity in this check:
        const COST_PER_CHECK = 0.05; // $0.05 per model query
        const totalChecks = (1 + competitorCount) * selectedModelIds.length * promptsPerModel;
        const estimatedRunCost = totalChecks * COST_PER_CHECK;

        // Validations
        if (includeCompetitors && !planFeatures.includes('competitor_analysis')) {
            return NextResponse.json({ error: 'Competitor Scan is a Premium/Ultra feature.' }, { status: 403 });
        }

        if (currentUsage + estimatedRunCost > limit) {
            return NextResponse.json({
                error: `Insufficient credits. This scan requires ~$${estimatedRunCost.toFixed(2)}, but you have $${(limit - currentUsage).toFixed(2)} remaining.`
            }, { status: 403 });
        }

        const company_name = profile.company_name || 'My Company';

        // 5. Create Test Run
        const { data: run, error: runError } = await supabase
            .from('test_runs')
            .insert({ user_id: user.id, status: 'running' })
            .select()
            .single();

        if (runError) throw runError;

        // 6. Generate Prompts (Strategies)
        // Note: For competitors, we simply use the SAME variations if possible, or regenerate.
        // To save time/cost, if we generated dynamic variations for "Self", we should reuse the raw text for competitors.
        // But `generatePrompts` encapsulates the logic. 
        // OPTIMIZATION: Call generatePrompts once for "Self" to get the strategies/texts, then re-use texts.

        const myStrategies = await generatePrompts({
            industry: profile.industry,
            keywords: profile.keywords || [],
            company_name: company_name
        }, { basePrompt, variationCount });

        // Extract raw queries to reuse for competitors so we don't pay 4x LLM generaton cost
        // The strategies returned by generatePrompts are already formatted "System... User: query...", so we might need to parse or just change the company name in the text (risky regex).
        // BETTER: We refactored `generatePrompts` to accept `fixedVariations`. We can extract the raw variations if we had them?
        // Actually, `myStrategies` are formatted prompts. 
        // Let's iterate and extract the "USER QUERY: "..." part if we want to be clever, 
        // OR just pass `basePrompt` to competitors too (independent generation, maybe slightly different results, acceptable but slower).
        // Since we want consistency, let's try to pass the same "variations" if we can.

        // If we used dynamic generation, we can't easily extract the raw queries from the formatted string without Regex.
        // Regex to extract: /USER QUERY: "(.*?)"/ 
        // Let's do that for consistency and speed.

        let rawVariations: string[] | undefined;
        if (basePrompt) {
            rawVariations = myStrategies.map(s => {
                const match = s.text.match(/USER QUERY: "(.*?)"/);
                return match ? match[1] : basePrompt; // Fallback
            });
        }

        // Competitors
        let competitorStrategies: { text: string; type: string; subject: string }[] = [];
        if (competitorCount > 0) {
            const topCompetitors = competitorData.slice(0, 3);
            for (const comp of topCompetitors) {
                // Use fixedVariations if we have them (from basePrompt flow), otherwise use default logic
                const strategies = await generatePrompts({
                    industry: profile.industry,
                    keywords: [],
                    company_name: comp
                }, {
                    basePrompt: basePrompt, // Just in case we didn't extract well
                    variationCount,
                    fixedVariations: rawVariations // Use the reused ones!
                });
                strategies.forEach(s => competitorStrategies.push({ ...s, subject: comp }));
            }
        }

        const timestamp = new Date().toISOString();

        const allChecks = [
            ...myStrategies.map(s => ({ ...s, subject: company_name })),
            ...competitorStrategies
        ];

        // 7. Queue Items
        const itemsToInsert = selectedModelIds.flatMap(model =>
            allChecks.map(check => ({
                run_id: run.id,
                model_name: model,
                prompt_text: check.text,
                subject: check.subject,
                status: 'pending',
                created_at: timestamp
            }))
        );

        if (itemsToInsert.length === 0) {
            throw new Error('No prompts generated. Please check your settings or base prompt.');
        }

        const { error: insertError } = await supabase
            .from('test_results')
            .insert(itemsToInsert);

        if (insertError) throw insertError;

        return NextResponse.json({
            success: true,
            runId: run.id,
            count: itemsToInsert.length,
            message: "Scan queued successfully. Processing started."
        });

    } catch (error: any) {
        console.error('Test Run Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
