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

        // 0. Check & Reset Billing Cycle (Using existing RPC)
        await supabase.rpc('check_and_reset_usage', { user_id: user.id });

        // 1. Validation
        const { includeCompetitors } = await StartScanSchema.parseAsync(body);

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

        // 3. Rate Limiting (DB-based)
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

        // Check Usage Limits
        const currentUsage = profile.credits_used || 0;

        // Validating Premium Feature
        if (includeCompetitors && !planFeatures.includes('competitor_analysis')) {
            return NextResponse.json({ error: 'Competitor Scan is a Premium/Ultra feature.' }, { status: 403 });
        }

        if (currentUsage >= limit) return NextResponse.json({ error: 'Credit limit reached.' }, { status: 403 });

        const company_name = profile.company_name || 'My Company';

        // 3. Create a Test Run
        const { data: run, error: runError } = await supabase
            .from('test_runs')
            .insert({ user_id: user.id, status: 'running' })
            .select()
            .single();

        if (runError) throw runError;

        // 4. Models to Query
        const selectedModelIds: string[] = profile.selected_models || [
            'openai/gpt-4o', 'google/gemini-1.5-pro', 'anthropic/claude-3-5-sonnet'
        ];

        // 5. Generate Prompts (Strategies)
        const myStrategies = generatePrompts({
            industry: profile.industry,
            keywords: profile.keywords || [],
            company_name: company_name
        });

        // Competitors
        let competitorStrategies: { text: string; type: string; subject: string }[] = [];
        if (includeCompetitors && profile.competitors && profile.competitors.length > 0) {
            const topCompetitors = profile.competitors.slice(0, 3);
            topCompetitors.forEach((comp: string) => {
                const strategies = generatePrompts({
                    industry: profile.industry,
                    keywords: [],
                    company_name: comp
                });
                strategies.forEach(s => competitorStrategies.push({ ...s, subject: comp }));
            });
        }

        const timestamp = new Date().toISOString();

        const allChecks = [
            ...myStrategies.map(s => ({ ...s, subject: company_name })),
            ...competitorStrategies
        ];

        // 6. Queue Items (Insert with status='pending')
        const itemsToInsert = selectedModelIds.flatMap(model =>
            allChecks.map(check => ({
                run_id: run.id,
                model_name: model,
                prompt_text: check.text,
                subject: check.subject,
                status: 'pending', // Explicitly pending
                created_at: timestamp
            }))
        );

        const { error: insertError } = await supabase
            .from('test_results')
            .insert(itemsToInsert);

        if (insertError) throw insertError;

        // Return immediately
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
