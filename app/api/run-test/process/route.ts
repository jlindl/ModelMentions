import { createClient } from '../../../utils/supabase/server';
import { NextResponse } from 'next/server';
import { callLLM } from '../../../lib/llm';
import { ProcessBatchSchema } from '../../../lib/validators';

const DEFAULT_INPUT_COST = 0.000003;
const DEFAULT_OUTPUT_COST = 0.000015;

// Helper to analyze the response
// Helper removed (using Structured Outputs)

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { runId, batchSize } = await ProcessBatchSchema.parseAsync(body);

        // 1. Fetch pending items
        const { data: pendingItems, error: fetchError } = await supabase
            .from('test_results')
            .select('*')
            .eq('run_id', runId)
            .eq('status', 'pending')
            .limit(batchSize);

        if (fetchError) throw fetchError;

        if (!pendingItems || pendingItems.length === 0) {
            // Check if ANY pending items remain (to see if run is fully complete)
            const { count } = await supabase
                .from('test_results')
                .select('*', { count: 'exact', head: true })
                .eq('run_id', runId)
                .eq('status', 'pending');

            if (count === 0) {
                // Mark run as complete
                await supabase.from('test_runs').update({ status: 'completed' }).eq('id', runId);
                return NextResponse.json({ completed: true, processed: 0, remaining: 0 });
            }
            return NextResponse.json({ completed: false, processed: 0, remaining: count });
        }

        // 2. Fetch Model Pricing (Optimization: Cache this if possible, or fetch once)
        const modelIds = Array.from(new Set(pendingItems.map(item => item.model_name)));
        const { data: modelsData } = await supabase
            .from('available_models')
            .select('id, cost_per_input_token, cost_per_output_token')
            .in('id', modelIds);

        const modelPricing = new Map();
        modelsData?.forEach((m) => modelPricing.set(m.id, { input: m.cost_per_input_token, output: m.cost_per_output_token }));

        // 3. Process Batch in Parallel
        let totalBatchCost = 0;

        const updates = await Promise.all(pendingItems.map(async (item) => {
            try {
                // Call LLM with JSON Mode
                const llmResponse = await callLLM({
                    model: item.model_name,
                    messages: [{ role: 'user', content: item.prompt_text }],
                    jsonMode: true
                });

                let runCost = llmResponse.cost || 0;
                if (runCost === 0 && llmResponse.usage) {
                    const inTokens = llmResponse.usage.prompt_tokens;
                    const outTokens = llmResponse.usage.completion_tokens;
                    const pricing = modelPricing.get(item.model_name) || { input: DEFAULT_INPUT_COST, output: DEFAULT_OUTPUT_COST };
                    runCost = (inTokens * pricing.input) + (outTokens * pricing.output);
                }
                totalBatchCost += runCost;

                // Parse JSON Output
                let analysis = { is_mentioned: false, rank: null as number | null, sentiment: 0, response_text: llmResponse.text };
                try {
                    let jsonStr = llmResponse.text.trim();
                    // 1. Unescape Markdown
                    if (jsonStr.startsWith('```')) {
                        jsonStr = jsonStr.replace(/^```(json)?\s*/, '').replace(/\s*```$/, '');
                    }
                    // 2. Fallback: find first { and last }
                    const firstBrace = jsonStr.indexOf('{');
                    const lastBrace = jsonStr.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1) {
                        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
                    }

                    const parsed = JSON.parse(jsonStr);
                    analysis.is_mentioned = parsed.is_mentioned;
                    analysis.rank = parsed.rank;
                    analysis.sentiment = parsed.sentiment;
                    if (parsed.response_text) analysis.response_text = parsed.response_text;
                } catch (e) {
                    console.error("JSON Parse Error", llmResponse.text);
                    throw new Error("Failed to parse LLM JSON response");
                }

                return {
                    id: item.id,
                    response_text: analysis.response_text,
                    is_mentioned: analysis.is_mentioned,
                    rank_position: analysis.rank,
                    sentiment_score: analysis.sentiment,
                    status: 'completed',
                    error_message: null,
                    cost: runCost
                };
            } catch (err: unknown) {
                console.error(`Error processing item ${item.id}`, err);
                return {
                    id: item.id,
                    status: 'failed',
                    error_message: err instanceof Error ? err.message : 'Unknown processing error'
                };
            }
        }));

        // 4. Update Results in DB
        for (const update of updates) {
            await supabase.from('test_results').update(update).eq('id', update.id);
        }

        // 5. Update User Credits
        // Fetch current credits again to be safe (atomic increment would be better, using RPC)
        if (totalBatchCost > 0) {
            // Strictly use RPC for atomic updates and to bypass Trigger restrictions
            const { error: creditError } = await supabase.rpc('increment_credits', {
                user_uuid: user.id,
                amount: totalBatchCost
            });

            if (creditError) {
                console.error('CRITICAL: Failed to update credits', creditError);
                // We do NOT attempt a fallback update here because the Trigger expressly forbids it.
                // We log it as a critical system failure.
            }
        }

        // 6. Check remaining count
        const { count: remaining } = await supabase
            .from('test_results')
            .select('*', { count: 'exact', head: true })
            .eq('run_id', runId)
            .eq('status', 'pending');

        if (remaining === 0) {
            await supabase.from('test_runs').update({ status: 'completed' }).eq('id', runId);
        }

        return NextResponse.json({
            success: true,
            processed: updates.length,
            remaining: remaining || 0,
            cost: totalBatchCost
        });

    } catch (error: unknown) {
        console.error('Batch Process Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
