import { createClient } from '../../utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // The `/auth/callback` route is required for the server-side auth flow with Supabase Auth helpers
    // The URL will look like: https://site.com/auth/callback?code=...
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error("Auth callback error:", error);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`);
}
