'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function SessionDiagnostics() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log("[🔍 SessionDiagnostics] Session Status:", status);
    if (session) {
      console.log("[🔍 SessionDiagnostics] Session User:", {
        id: session.user?.id,
        email: session.user?.email,
        role: session.user?.role,
        name: session.user?.name,
      });
      console.log("[🔍 SessionDiagnostics] AccessToken:", session.accessToken ? '✅ Present' : '❌ Missing');
      if (session.accessToken) {
        console.log("[🔍 SessionDiagnostics] AccessToken Value:", session.accessToken.substring(0, 20) + '...');
      }
    } else {
      console.log("[🔍 SessionDiagnostics] No session data");
    }
  }, [session, status]);

  return null; // This is just for logging diagnostics
}
