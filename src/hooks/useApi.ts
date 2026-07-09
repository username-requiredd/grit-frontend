import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

interface UseApiResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useApi<T>(url: string, options?: RequestInit): UseApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Start in loading state: on a hard page load (e.g. right after the OAuth
  // redirect) the session is still hydrating and we haven't fetched yet.
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.accessToken ?? null;

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const fetchData = useCallback(async (abortSignal?: AbortSignal) => {
    if (!url) {
      setError('A valid URL is required to fetch data.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // FIX 1: Align this variable with apiFetch.ts to prevent 404s
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

      console.log("[useApi] Fetching:", { url, fullUrl, hasSession: !!session, hasAccessToken: !!accessToken });

      const currentOptions = optionsRef.current;
      const headers = new Headers(currentOptions?.headers);

      const method = (currentOptions?.method ?? 'GET').toUpperCase();
      if (method !== 'GET' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      if (accessToken) {
        console.log("[useApi] Adding Authorization header with token");
        headers.set('Authorization', `Bearer ${accessToken}`);
      } else {
        console.warn("[useApi] ⚠️ No accessToken found in session!");
      }

      const response = await fetch(fullUrl, {
        ...currentOptions,
        headers,
        signal: abortSignal,
        // FIX 2: Prevent aggressive Next.js caching so refetch() actually gets new DB records
        cache: currentOptions?.cache || 'no-store', 
      });

      if (response.status === 401) {
        // Only destroy the session if we actually sent a token that the
        // backend rejected (expired/invalidated). A 401 on a request that
        // carried no token means the session simply wasn't available for
        // this request — signing out here would wipe a valid session.
        if (accessToken) {
          signOut({ callbackUrl: '/sign-in' });
          throw new Error('Unauthorized. Session expired.');
        }
        throw new Error('Not authenticated.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result: T = await response.json();
      setData(result);

    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') return;
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, accessToken]);

  useEffect(() => {
    // Wait for the session to hydrate before hitting the backend. After an
    // OAuth redirect the first render happens while useSession() is still
    // 'loading' — fetching then would send no Authorization header and 401.
    if (sessionStatus === 'loading') return;

    const abortController = new AbortController();
    fetchData(abortController.signal);
    return () => abortController.abort();
  }, [fetchData, sessionStatus]);

  const refetch = useCallback(async () => {
    const controller = new AbortController();
    await fetchData(controller.signal);
  }, [fetchData]);

  return { data, error, isLoading, refetch };
}