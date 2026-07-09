import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Debug endpoint to diagnose session and authentication state
 * GET /api/auth/debug - returns current session status
 * 
 * Use this endpoint to verify:
 * 1. Session exists and is valid
 * 2. All required user fields are present
 * 3. AccessToken is available for API calls
 * 4. Role is properly set for authorization
 */
export async function GET() {
  try {
    const session = await auth();

    const debugInfo = {
      timestamp: new Date().toISOString(),
      hasSession: !!session,
      sessionUser: session?.user ? {
        id: session.user.id || "❌ MISSING",
        email: session.user.email || "❌ MISSING",
        name: session.user.name || "⚠️ MISSING",
        image: session.user.image || "⚠️ MISSING",
        role: session.user.role || "❌ MISSING",
      } : null,
      accessToken: {
        present: !!(session as any)?.accessToken,
        preview: (session as any)?.accessToken 
          ? (session as any).accessToken.substring(0, 20) + "..." 
          : "❌ MISSING",
      },
      sessionDetails: {
        allFields: session ? Object.keys(session) : [],
        userFields: session?.user ? Object.keys(session.user) : [],
      },
    };

    // Validate that session has all required fields
    const issues: string[] = [];
    
    if (!session) {
      issues.push("❌ CRITICAL: No session exists - user is not authenticated");
    } else {
      if (!session.user?.id) issues.push("❌ CRITICAL: Missing user.id");
      if (!session.user?.email) issues.push("❌ CRITICAL: Missing user.email");
      if (!session.user?.role) issues.push("❌ CRITICAL: Missing user.role");
      if (!(session as any)?.accessToken) issues.push("⚠️ WARNING: Missing accessToken (might break API calls)");
    }

    return NextResponse.json({
      ...debugInfo,
      validation: {
        valid: issues.length === 0,
        issues,
      },
      recommendations: issues.length > 0 
        ? ["Check browser console for [NextAuth *] logs", 
           "Verify backend /auth/google endpoint returns user object",
           "Check middleware logs to see if session is being recognized",
           "Review Network tab to see if session cookie is being set"]
        : ["✅ Session looks valid", "Try accessing /board to verify access works"],
    });
  } catch (error) {
    return NextResponse.json({
      error: "Debug endpoint error",
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
