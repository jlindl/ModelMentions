import { createClient } from '../../utils/supabase/server';
import { NextResponse } from 'next/server';
import { callLLM } from '../../lib/llm';

// Helper to analyze the response (can be moved to a separate function/file later)
function analyzeResponse(text: string, brandName: string) {
    const lowerText = text.toLowerCase();
    const lowerBrand = brandName.toLowerCase();

    // 1. Mention Check
    const isMentioned = lowerText.includes(lowerBrand);

    // 2. Rank Extraction (heuristic)
    // Look for "1. BrandName" or "- BrandName" patterns
    let rank = null;
    if (isMentioned) {
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(lowerBrand)) {
                // Try to extract number at start of line "1." or "1)"
                const match = lines[i].match(/^(\d+)[\.)]/);
                if (match) {
                    rank = parseInt(match[1]);
                    break;
                }
            }
        }
    }

    // 3. Sentiment Analysis (Basic Keyword Heuristic for now, or use another LLM call)
    // Positive words: best, great, powerful, top, leading
    // Negative words: slow, expensive, buggy, limited
    let sentiment = 0;
    if (isMentioned) {
        const positive = ['best', 'great', 'excellent', 'top', 'robust', 'powerful', 'leading', 'recommend'];
        const negative = ['slow', 'expensive', 'bad', 'limited', 'buggy', 'hard', 'poor'];

        let score = 0;
        positive.forEach(w => { if (lowerText.includes(w)) score += 0.2; });
        negative.forEach(w => { if (lowerText.includes(w)) score -= 0.25; });

        // Clamp between -1 and 1
        sentiment = Math.max(-1, Math.min(1, score));
        // Bias towards positive if likely neutral list
        if (score === 0) sentiment = 0.1;
    }

    return { isMentioned, rank, sentiment };
}

import { generatePrompts } from '../../lib/prompt-generator';

// Plan Limits in USD
const PLAN_LIMITS: Record<string, number> = {
    'free': 0.25,
    'pro': 5.00,
    'premium': 15.00,
    'ultra': 50.00
};

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { includeCompetitors } = await request.json().catch(() => ({}));

        // 1. Fetch User Profile
        let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            throw new Error('User profile not found. Please complete settings first.');
        }

        // Check & Reset Monthly Usage
        const { error: rpcError } = await supabase.rpc('check_and_reset_usage', { user_id: user.id });
        if (!rpcError) {
            const { data: refined } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (refined) profile = refined;
        }

        // 2. Check Usage Limits
        const userPlan = profile.plan || 'free';
        const currentUsage = profile.credits_used || 0;
        const limit = PLAN_LIMITS[userPlan] || 0.25;

        // Validating Premium Feature
        if (includeCompetitors && (userPlan === 'free' || userPlan === 'pro')) {
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
        let models: string[] = profile.selected_models || [
            'openai/gpt-4o', 'google/gemini-1.5-pro', 'anthropic/claude-3-5-sonnet', 'perplexity/sonar-large-online'
        ];

        models = models.filter(id => id.includes('/')); // Simple validation

        // 5. Generate Dynamic Prompts
        // A. For Main Brand
        const myStrategies = generatePrompts({
            industry: profile.industry,
            keywords: profile.keywords || [],
            company_name: company_name
        });

        // B. For Competitors (if enabled)
        let competitorStrategies: { text: string; type: string; subject: string }[] = [];

        if (includeCompetitors && profile.competitors && profile.competitors.length > 0) {
            // We take top 3 competitors to avoid explosion of cost
            const topCompetitors = profile.competitors.slice(0, 3);

            topCompetitors.forEach((comp: string) => {
                const strategies = generatePrompts({
                    industry: profile.industry, // Same industry context
                    keywords: [], // We don't use keywords for competitors usually, or use generic ones
                    company_name: comp
                });

                strategies.forEach(s => {
                    competitorStrategies.push({ ...s, subject: comp });
                });
            });
        }

        const timestamp = new Date().toISOString();
        let totalRunCost = 0;

        // Combine all checks
        // Main Brand items have subject = company_name
        const allChecks = [
            ...myStrategies.map(s => ({ ...s, subject: company_name })),
            ...competitorStrategies
        ];

        // 6. Execute Scans
        const executionPromises = models.flatMap(model =>
            allChecks.map(async (check) => {
                try {
                    const llmResponse = await callLLM({
                        model: model,
                        messages: [{ role: 'user', content: check.text }]
                    });

                    let runCost = llmResponse.cost || 0;
                    if (runCost === 0 && llmResponse.usage) {
                        const inTokens = llmResponse.usage.prompt_tokens;
                        const outTokens = llmResponse.usage.completion_tokens;
                        runCost = (inTokens * 0.000003) + (outTokens * 0.000015);
                    }
                    totalRunCost += runCost;

                    // We analyze against the SUBJECT of this specific check
                    const analysis = analyzeResponse(llmResponse.text, check.subject);

                    return {
                        run_id: run.id,
                        model_name: model,
                        prompt_text: check.text,
                        response_text: llmResponse.text,
                        is_mentioned: analysis.isMentioned,
                        rank_position: analysis.rank,
                        sentiment_score: analysis.sentiment,
                        created_at: timestamp,
                        subject: check.subject // NEW FIELD
                    };
                } catch (err: any) {
                    console.error(`Error querying ${model}`, err);
                    return {
                        run_id: run.id,
                        model_name: model,
                        prompt_text: check.text,
                        response_text: `Error: ${err.message}`,
                        is_mentioned: false,
                        sentiment_score: 0,
                        rank_position: null,
                        created_at: timestamp,
                        subject: check.subject
                    };
                }
            })
        );

        const processedResults = await Promise.all(executionPromises);

        // 7. Save Results
        const { error: resultsError } = await supabase
            .from('test_results')
            .insert(processedResults);

        if (resultsError) throw resultsError;

        await supabase.from('test_runs').update({ status: 'completed' }).eq('id', run.id);

        const newUsage = (profile.credits_used || 0) + totalRunCost;
        await supabase.from('profiles').update({ credits_used: newUsage }).eq('id', user.id);

        return NextResponse.json({
            success: true,
            runId: run.id,
            count: processedResults.length,
            cost: totalRunCost
        });

    } catch (error: any) {
        console.error('Test Run Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
