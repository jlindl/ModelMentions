import { createClient } from '../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Get current profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('selected_models')
            .eq('id', user.id)
            .single();

        const currentModels = profile?.selected_models || [];

        // 2. Filter out known bad IDs
        // "Bad" means they don't contain a slash '/' (provider prefix) AND aren't one of the special OpenAI shortcodes if any
        // OpenRouter IDs usually have a slash "provider/model". 
        // We will strictly enforce slash for now, or just remove the specific ones we know are bad.

        const knownBad = ['claude-3-opus', 'gemini-pro', 'openai/gpt-5.2-pro', 'gpt-4o']; // gpt-4o might lack openai/ prefix if from old default

        // Also simpler logic: if it doesn't look like "provider/model" (has a slash), generic filter?
        // But maybe "gpt-4o" works? Let's assume we want to clean everything that looks suspicious.

        const cleanedModels = currentModels.filter((id: string) => {
            // Remove specific bad ones
            if (knownBad.includes(id)) return false;
            // Remove if no slash (OpenRouter standards)
            if (!id.includes('/')) return false;

            return true;
        });

        // 3. Update profile
        const { error } = await supabase
            .from('profiles')
            .update({ selected_models: cleanedModels })
            .eq('id', user.id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Fixed models',
            removed: currentModels.length - cleanedModels.length,
            previous: currentModels,
            current: cleanedModels
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
