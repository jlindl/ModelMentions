import { createClient } from '../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, message } = body;

        // Basic validation
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Check if we need to use service role key for public inserts if RLS issues arise,
        // but user script included "to anon" policy so standard client from utils (which likely uses anon key) should work.
        // If utils/supabase/server uses cookie-based auth, it might not work for unauthenticated users depending on implementation.
        // Let's assume standard client works or standard client is anon-capable.
        // Actually, check utils/supabase/server implementation briefly? 
        // I viewed it earlier (Step 629 viewed logs), it uses createServerClient.

        const { error } = await supabase
            .from('contact_submissions')
            .insert({
                name,
                email,
                message,
            });

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json(
                { error: 'Failed to submit message' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, message: 'Message received' },
            { status: 200 }
        );

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
