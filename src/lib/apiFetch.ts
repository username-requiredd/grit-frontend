import { getSession, signOut } from "next-auth/react";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  try {
    // Get current session to attach token
    const session = await getSession();
    
    const headers = new Headers(options.headers);
    
    // Attach authorization token if available
    if (session?.accessToken) {
      console.log(`[apiFetch] Adding Authorization header for ${endpoint}`);
      headers.set("Authorization", `Bearer ${session.accessToken}`);
    } else if (!endpoint.includes('/auth/')) {
      // Non-auth endpoints REQUIRE a valid session/token
      console.warn(`[apiFetch] ❌ No accessToken available for endpoint: ${endpoint}`);
      console.warn(`[apiFetch] Session status:`, {
        hasSession: !!session,
        hasAccessToken: !!session?.accessToken,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
      });
    }

    // Perform the API request
    console.log(`[apiFetch] Calling: ${endpoint}`);
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log(`[apiFetch] Response status: ${response.status} for ${endpoint}`);

    // Handle 401 Unauthorized - token expired or invalid.
    // Only sign out when we actually sent a token that the backend rejected;
    // a 401 on a token-less request (session not yet hydrated) must not
    // destroy an otherwise valid session.
    if (response.status === 401) {
      if (session?.accessToken) {
        console.warn(`[apiFetch] ❌ 401 Unauthorized on ${endpoint} - signing out user`);
        await signOut({ callbackUrl: "/sign-in" });
        throw new Error("Session expired. Please sign in again.");
      }
      console.warn(`[apiFetch] ❌ 401 on ${endpoint} without a token - not signing out`);
      throw new Error("Not authenticated.");
    }

    // Handle 403 Forbidden - user lacks permissions
    if (response.status === 403) {
      console.error(`[apiFetch] ❌ 403 Forbidden on ${endpoint}`);
      throw new Error("You do not have permission to access this resource.");
    }

    // Return the response for the caller to handle
    return response;
  } catch (error) {
    console.error(`[apiFetch] ❌ Error calling ${endpoint}:`, error instanceof Error ? error.message : error);
    throw error;
  }
}