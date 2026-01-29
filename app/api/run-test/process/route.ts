import { createClient } from '../../../utils/supabase/server';
import { NextResponse } from 'next/server';
import { callLLM, getSupabaseAdmin } from '../../../lib/llm';
import { ProcessBatchSchema } from '../../../lib/validators';

const DEFAULT_INPUT_COST = 0.000003;
const DEFAULT_OUTPUT_COST = 0.000015;

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use Admin Client for DB operations to bypass RLS issues
    const supabaseAdmin = getSupabaseAdmin();

    try {
        const body = await request.json();
        const { runId, batchSize } = await ProcessBatchSchema.parseAsync(body);

        // Clamp batch size to avoid timeouts
        const safeBatchSize = Math.min(batchSize, 3);

        // 1. Fetch pending items
        const { data: pendingItems, error: fetchError } = await supabaseAdmin
            .from('test_results')
            .select('*')
            .eq('run_id', runId)
            .eq('status', 'pending')
            .limit(safeBatchSize);

        if (fetchError) throw fetchError;

        if (!pendingItems || pendingItems.length === 0) {
            // Check if ANY pending items remain
            const { count } = await supabaseAdmin
                .from('test_results')
                .select('*', { count: 'exact', head: true })
                .eq('run_id', runId)
                .eq('status', 'pending');

            if (count === 0) {
                // Mark run as complete
                await supabaseAdmin.from('test_runs').update({ status: 'completed' }).eq('id', runId);
                return NextResponse.json({ completed: true, processed: 0, remaining: 0 });
            }
            return NextResponse.json({ completed: false, processed: 0, remaining: count });
        }

        // 2. Fetch Model Pricing
        const modelIds = Array.from(new Set(pendingItems.map(item => item.model_name)));
        const { data: modelsData } = await supabaseAdmin
            .from('available_models')
            .select('id, cost_per_input_token, cost_per_output_token')
            .in('id', modelIds);

        const modelPricing = new Map();
        modelsData?.forEach((m) => modelPricing.set(m.id, { input: m.cost_per_input_token, output: m.cost_per_output_token }));

        // 3. Process Batch in Parallel
        let totalBatchCost = 0;

        const updates = await Promise.all(pendingItems.map(async (item) => {
            try {
                // STEP 1: Call Target Model (Natural Response)
                // We want a real, unbiased answer from the model.
                const generationResponse = await callLLM({
                    model: item.model_name,
                    messages: [{ role: 'user', content: item.prompt_text }],
                    jsonMode: false // We want natural text, not JSON
                });

                let totalCostForThisItem = 0;

                // Track Generation Cost
                let genCost = generationResponse.cost || 0;
                if (genCost === 0 && generationResponse.usage) {
                    const inTokens = generationResponse.usage.prompt_tokens;
                    const outTokens = generationResponse.usage.completion_tokens;
                    const pricing = modelPricing.get(item.model_name) || { input: DEFAULT_INPUT_COST, output: DEFAULT_OUTPUT_COST };
                    genCost = (inTokens * pricing.input) + (outTokens * pricing.output);
                }
                totalCostForThisItem += genCost;

                const naturalResponseText = generationResponse.text;

                // STEP 2: Call Judge Model (Analysis)
                // We use a smart, fast model to evaluate the response.
                // Using GPT-4o or similiar for reliable JSON extraction
                const JUDGE_MODEL = 'openai/gpt-4o';
                const judgePrompt = `
                Analyze the following AI response based on the original user query: "${item.prompt_text}".
                
                We are looking for the brand: "${item.subject || 'Brand'}"
                
                1. Is the brand mentioned? (boolean)
                2. If mentioned, what is its rank/position in the list? (number or null)
                3. What is the sentiment towards the brand? (-1.0 to 1.0)

                RESPONSE TO ANALYZE:
                """
                ${naturalResponseText}
                """

                OUTPUT FORMAT (JSON ONLY):
                {
                    "is_mentioned": boolean,
                    "rank": number | null,
                    "sentiment": number
                }
                `;

                const judgeResponse = await callLLM({
                    model: JUDGE_MODEL,
                    messages: [{ role: 'user', content: judgePrompt }],
                    jsonMode: true
                });

                // Track Judge Cost (Approximate if not dynamic, but usually negligible for 4o-mini, using 4o default for now)
                // In a perfect world we fetch 4o price, but let's assume standard pricing to avoid DB overhead or use returned cost.
                totalCostForThisItem += (judgeResponse.cost || 0);
                totalBatchCost += totalCostForThisItem;

                // Parse Judge Output
                let analysis = { is_mentioned: false, rank: null as number | null, sentiment: 0 };
                try {
                    let jsonStr = judgeResponse.text.trim();
                    if (jsonStr.startsWith('```')) {
                        jsonStr = jsonStr.replace(/^```(json)?\s*/, '').replace(/\s*```$/, '');
                    }
                    const parsed = JSON.parse(jsonStr);
                    analysis.is_mentioned = parsed.is_mentioned;
                    analysis.rank = parsed.rank;
                    analysis.sentiment = parsed.sentiment;
                } catch (e) {
                    console.error("Judge JSON Parse Error", judgeResponse.text);
                    // Fallback to defaults
                }

                // Double Check Mechanism (User Request: "Simple Script" + Regex)
                // If Judge says false, but text clearly mentions the brand, override it.
                if (item.subject && naturalResponseText) {
                    const cleanSubject = item.subject.toLowerCase().trim();
                    const cleanResponse = naturalResponseText.toLowerCase();

                    // Escape special regex characters in the brand name
                    const escapedSubject = cleanSubject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                    // Use Word Boundaries (check for start/end or non-word chars)
                    const regex = new RegExp(`(?:^|\\W)${escapedSubject}(?:$|\\W)`, 'i');

                    if (regex.test(cleanResponse)) {
                        analysis.is_mentioned = true;
                    }
                }

                return {
                    id: item.id,
                    response_text: naturalResponseText, // Save the REAL response
                    is_mentioned: analysis.is_mentioned,
                    rank_position: analysis.rank,
                    sentiment_score: analysis.sentiment,
                    status: 'completed',
                    error_message: null
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
            const { error: updateError } = await supabaseAdmin
                .from('test_results')
                .update(update)
                .eq('id', update.id);

            if (updateError) {
                console.error("Failed to update result via Admin", updateError);
            }
        }

        // 5. Update User Credits
        if (totalBatchCost > 0) {
            // Strictly use RPC for atomic updates
            const { error: creditError } = await supabaseAdmin.rpc('increment_credits', {
                user_uuid: user.id,
                amount: totalBatchCost
            });
            if (creditError) console.error('CRITICAL: Failed to update credits', creditError);
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
