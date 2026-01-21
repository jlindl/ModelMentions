import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
    const supabase = await createClient();

    // 1. Fetch active monitors
    const { data: monitors } = await supabase
        .from('monitors')
        .select('*')
        .eq('is_active', true);

    if (!monitors || monitors.length === 0) {
        return NextResponse.json({ message: 'No monitors to run' });
    }

    // 2. Simulate processing (In real app, we'd loop and call llm.ts)
    const processed = [];

    for (const monitor of monitors) {
        // Mock Score Generation
        const newScore = Math.floor(Math.random() * (100 - 60 + 1) + 60); // 60-100
        const status = newScore < 70 ? 'warning' : 'success';
        const message = newScore < 70
            ? `Visibility dropped to ${newScore}% regarding "${monitor.query}"`
            : `Maintained high visibility (${newScore}%) for "${monitor.query}"`;

        // Update Monitor Time
        const { error: updateError } = await supabase
            .from('monitors')
            .update({
                last_run: new Date().toISOString(),
                next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // +1 day
            })
            .eq('id', monitor.id);

        if (!updateError) {
            // Log Activity
            await supabase.from('monitor_logs').insert({
                monitor_id: monitor.id,
                status: status,
                visibility_score: newScore,
                message: message
            });
            processed.push(monitor.id);
        }
    }

    return NextResponse.json({
        success: true,
        processed_count: processed.length,
        processed_ids: processed
    });
}
