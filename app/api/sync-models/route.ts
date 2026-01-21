import { createClient } from '../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Fetch from OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/models');

        if (!response.ok) {
            throw new Error(`OpenRouter API failed: ${response.statusText}`);
        }

        const data = await response.json();
        const openRouterModels = data.data;

        // 2. Transform Data
        const modelsToUpsert = openRouterModels.map((model: any) => {
            // Extract provider only (everything before the first slash)
            const provider = model.id.split('/')[0];

            // Format Name (remove provider prefix if present for cleaner display, strictly cosmetic)
            // e.g. "anthropic/claude-3-opus" -> "Claude 3 Opus"
            const name = model.name;

            // Calculate costs (OpenRouter gives per 1M tokens usually, or raw. Let's assume raw string or number)
            // OpenRouter 'pricing' object: { prompt: '0.000005', completion: '0.000015' } (per token usually)
            const costInput = parseFloat(model.pricing?.prompt || '0');
            const costOutput = parseFloat(model.pricing?.completion || '0');

            return {
                id: model.id,
                name: name,
                provider: provider.charAt(0).toUpperCase() + provider.slice(1), // Capitalize
                cost_per_input_token: costInput,
                cost_per_output_token: costOutput,
                is_active: true,
                created_at: new Date().toISOString()
            };
        });

        // 3. Upsert to Supabase
        const { error } = await supabase
            .from('available_models')
            .upsert(modelsToUpsert, { onConflict: 'id' });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            count: modelsToUpsert.length,
            message: `Successfully synced ${modelsToUpsert.length} models.`
        });

    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
