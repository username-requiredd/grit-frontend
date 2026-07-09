import { auth } from "@/auth"
import { NextResponse } from 'next/server'

console.log("[Middleware Init] Auth middleware loaded");

export default auth((req) => {
  try {
    const isLoggedIn = !!req.auth
    const { pathname } = req.nextUrl

    // Log authentication state for debugging
    if (isLoggedIn) {
      console.log(`[Middleware] ✅ Path: ${pathname}, User authenticated:`, {
        id: req.auth?.user?.id,
        email: req.auth?.user?.email,
        role: req.auth?.user?.role,
        hasAccessToken: !!(req.auth as any).accessToken
      });
    } else {
      console.log(`[Middleware] ❌ Path: ${pathname}, User NOT authenticated`);
    }

    // Warn when unauthenticated users try to access protected paths
    if (!isLoggedIn && (pathname.startsWith('/board') || pathname.startsWith('/admin'))) {
      console.warn(`[Middleware] ❌ User not authenticated, attempting to access protected route: ${pathname} - redirecting to /sign-in`)
    }

    const isProtectedPath = pathname.startsWith('/dashboard') || pathname.startsWith('/board') || pathname.startsWith('/admin')
    const isAuthPath = pathname === '/sign-in' || pathname === '/sign-up'

    // Protect routes that require authentication
    if (isProtectedPath && !isLoggedIn) {
      console.warn(`[Middleware] 🔒 Protected path ${pathname} with no auth - redirecting to /sign-in`)
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    // Redirect authenticated users away from auth pages to appropriate dashboard
    if (isAuthPath && isLoggedIn) {
      // Rely on the role we now successfully pass through the session
      const role = req.auth?.user?.role;
      const redirectPath = role === 'ADMIN' ? '/admin' : '/board';
      console.log(`[Middleware] ✅ User already logged in on auth page, redirecting to ${redirectPath}`)
      return NextResponse.redirect(new URL(redirectPath, req.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("[Middleware] ❌ Error in middleware:", error instanceof Error ? error.message : error);
    console.error("[Middleware] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.next();
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};