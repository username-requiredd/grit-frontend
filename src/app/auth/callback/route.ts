import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error - cookies may not be settable in some contexts
            }
          },
        },
      }
    );

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth callback error:', error);
      // Redirect to sign-in with error
      return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Redirect to dashboard after successful sign-in
  return NextResponse.redirect(`${origin}/dashboard`);
}