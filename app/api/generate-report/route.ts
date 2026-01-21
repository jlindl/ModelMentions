import { createClient } from '../../utils/supabase/server';
import { NextResponse } from 'next/server';
import { callLLM } from '../../lib/llm';

export async function POST(request: Request) {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check User Plan
    const { data: profile } = await supabase
        .from('profiles')
        .select('*') // Get all fields including usage
        .eq('id', user.id)
        .single();

    if (!profile?.plan || profile.plan === 'free') {
        return NextResponse.json({
            error: 'Intelligent Reports are only available on PRO plans and above.'
        }, { status: 403 });
    }

    // 0. Check & Reset Monthly Usage
    // We call the RPC we just created. It's safe to call every time or we can check the date first in JS to save an RPC call,
    // but RPC is safer for atomicity.
    const { error: rpcError } = await supabase.rpc('check_and_reset_usage', { user_id: user.id });
    if (rpcError) console.error('Reset RPC Error:', rpcError);

    // Re-fetch usage after potential reset (or we could have returned it from RPC)
    const { data: freshProfile } = await supabase
        .from('profiles')
        .select('reports_usage, plan')
        .eq('id', user.id)
        .single();

    const usage = freshProfile?.reports_usage || 0;
    const plan = freshProfile?.plan || 'pro';

    const LIMITS: Record<string, number> = { 'pro': 10, 'premium': 30, 'ultra': 200 };
    const limit = LIMITS[plan] || 10;

    if (usage >= limit) {
        return NextResponse.json({
            error: `Monthly Report limit reached for ${plan.toUpperCase()} plan. (${usage}/${limit})`
        }, { status: 403 });
    }

    try {
        const { startDate, endDate } = await request.json();

        // 1. Fetch Test Results for the period
        // We join with profiles to ensure we only get this user's data (RLS should handle it, but explicit check is good)
        const { data: results, error } = await supabase
            .from('test_results')
            .select(`
                id,
                model_name,
                response_text,
                sentiment_score,
                is_mentioned,
                created_at
            `)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!results || results.length === 0) {
            return NextResponse.json({ report: "No data available for the selected time period. Please run some tests first." });
        }

        // 2. Aggregate Data for the Prompt
        const totalScans = results.length;
        const totalMentions = results.filter(r => r.is_mentioned).length;
        const avgSentiment = results.reduce((acc, r) => acc + (r.sentiment_score || 0), 0) / (totalScans || 1);

        // Group by Model
        const modelStats: Record<string, { scans: number, mentions: number, sentimentSum: number }> = {};
        results.forEach(r => {
            const name = r.model_name;
            if (!modelStats[name]) modelStats[name] = { scans: 0, mentions: 0, sentimentSum: 0 };
            modelStats[name].scans++;
            if (r.is_mentioned) modelStats[name].mentions++;
            modelStats[name].sentimentSum += (r.sentiment_score || 0);
        });

        const modelSummary = Object.entries(modelStats).map(([name, stats]) => {
            return `- **${name}**: ${stats.mentions}/${stats.scans} Mentions (${Math.round((stats.mentions / stats.scans) * 100)}%), Avg Sentiment: ${(stats.sentimentSum / stats.scans).toFixed(1)}/10`;
        }).join('\n');

        // 3. Construct LLM Prompt
        const systemPrompt = "You are a Senior Brand Analyst for 'ModelMentions'. Your job is to analyze raw LLM performance data and generate a professional, executive-level report in Markdown format.";

        const userPrompt = `
        Time Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}
        
        **Executive Metrics:**
        - Total Model Checks: ${totalScans}
        - Successful Mentions: ${totalMentions}
        - Brand Visibility Rate: ${Math.round((totalMentions / totalScans) * 100)}%
        - Average Sentiment Score: ${avgSentiment.toFixed(1)}/100

        **Performance by Model:**
        ${modelSummary}

        **Raw Data Samples (Last 5 runs):**
        ${results.slice(-5).map(r => `- [${r.model_name}] "${r.response_text.substring(0, 100)}..." (Sentiment: ${r.sentiment_score})`).join('\n')}

        **Instructions:**
        Write a comprehensive "Brand Visibility Intelligence Report".
        Use H2 (##) for section titles.
        Sections required:
        1. **Executive Summary**: High-level overview of brand presence in AI models.
        2. **Visibility Analysis**: Which models know the brand? Which don't? Any patterns?
        3. **Sentiment & Perception**: How is the brand being described? Positive/Neutral/Negative trends.
        4. **Strategic Recommendations**: What should the brand do to improve visibility based on this data? (e.g. "Focus on optimizing for Anthropic models where visibility is low").
        
        Style: Professional, data-driven, concise but insightful. Use bolding for key insights.
        `;

        // 4. Call LLM (Using GPT-4o via OpenRouter as the high-intelligence model)
        // User requested "GPT 5.2", we map this to the most capable model available: openai/gpt-4o
        console.log('Sending report generation request to OpenRouter (openai/gpt-4o)...');
        const llmResponse = await callLLM({
            model: 'openai/gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        });

        if (!llmResponse || !llmResponse.text) {
            throw new Error('Received empty response from AI Analyst.');
        }

        const reportContent = llmResponse.text;
        const reportTitle = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()} Analysis`;

        // 5. Save Report to Database
        const { data: savedReport, error: saveError } = await supabase
            .from('reports')
            .insert({
                user_id: user.id,
                title: reportTitle,
                content: reportContent,
                start_date: startDate,
                end_date: endDate
            })
            .select()
            .single();

        if (saveError) {
            console.error('Failed to save report:', saveError);
            // We still return the report even if save failed, but maybe warn
        }

        // Increment Usage
        await supabase
            .from('profiles')
            .update({ reports_usage: (usage || 0) + 1 }) // usage var comes from earlier fetch
            .eq('id', user.id);

        return NextResponse.json({ report: reportContent, id: savedReport?.id, savedReport });

    } catch (error: any) {
        console.error('Report Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
