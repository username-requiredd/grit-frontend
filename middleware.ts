import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired - this exchanges the refresh token for a new session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  console.log("session",session)
  const url = req.nextUrl;

  const isProtectedPath = url.pathname.startsWith('/dashboard') || 
                          url.pathname.startsWith('/board');

  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/sign-in', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (session && (url.pathname === '/sign-in' || url.pathname === '/sign-up')) {
    const redirectUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/board/:path*',
    '/signin',
    '/sign-up',
  ],
};