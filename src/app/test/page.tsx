'use client';

import { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '../../../utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const supabase = createClient();
  const router = useRouter();
  const [authState, setAuthState] = useState({
    isLoading: true,
    session: null,
    user: null,
    error: null,
  });
  const [debugInfo, setDebugInfo] = useState({
    supabaseUrl: '',
    hasAnonKey: false,
    authListenerActive: false,
    redirectAttempts: 0,
    lastEvent: '',
    eventTimestamp: '',
  });
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (test, status, details = '') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { test, status, details, timestamp }]);
  };

  useEffect(() => {
    // Check Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    setDebugInfo(prev => ({
      ...prev,
      supabaseUrl: supabaseUrl || 'NOT SET',
      hasAnonKey,
    }));

    if (!supabaseUrl || supabaseUrl === 'NOT SET') {
      addTestResult('Configuration', '❌', 'NEXT_PUBLIC_SUPABASE_URL not set');
    } else {
      addTestResult('Configuration', '✅', 'Supabase URL configured');
    }

    if (!hasAnonKey) {
      addTestResult('Configuration', '❌', 'NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
    } else {
      addTestResult('Configuration', '✅', 'Supabase Anon Key configured');
    }

    // Check initial session
    const checkSession = async () => {
      try {
        addTestResult('Session Check', '⏳', 'Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session check error:', error);
          addTestResult('Session Check', '❌', `Error: ${error.message}`);
          setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
          return;
        }

        if (session) {
          console.log('✅ Session found:', {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: new Date(session.expires_at * 1000).toLocaleString(),
            provider: session.user.app_metadata?.provider,
          });
          
          addTestResult('Session Check', '✅', `Found session for ${session.user.email}`);
          
          setAuthState({
            isLoading: false,
            session,
            user: session.user,
            error: null,
          });

          // Redirect to dashboard
          console.log('🔄 Redirecting to dashboard...');
          addTestResult('Redirect', '⏳', 'Attempting redirect to /dashboard');
          setDebugInfo(prev => ({ ...prev, redirectAttempts: prev.redirectAttempts + 1 }));
          
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 500);
        } else {
          console.log('ℹ️ No existing session found');
          addTestResult('Session Check', 'ℹ️', 'No existing session - ready for sign in');
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (err) {
        console.error('💥 Unexpected error:', err);
        addTestResult('Session Check', '❌', `Unexpected error: ${err.message}`);
        setAuthState(prev => ({ 
          ...prev, 
          error: err.message || 'Unexpected error occurred',
          isLoading: false 
        }));
      }
    };

    checkSession();

    // Set up auth state listener
    console.log('🎧 Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`🔔 [${timestamp}] Auth event:`, event, session ? '(Session exists)' : '(No session)');
        
        setDebugInfo(prev => ({ 
          ...prev, 
          authListenerActive: true,
          lastEvent: event,
          eventTimestamp: timestamp,
        }));

        if (event === 'INITIAL_SESSION') {
          addTestResult('Auth Listener', '✅', 'Auth listener initialized');
        }

        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in successfully:', {
            userId: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata?.provider,
            expiresAt: new Date(session.expires_at * 1000).toLocaleString(),
          });

          addTestResult('Sign In', '✅', `Signed in as ${session.user.email}`);

          setAuthState({
            isLoading: false,
            session,
            user: session.user,
            error: null,
          });

          // Delay to ensure cookies are set properly
          addTestResult('Redirect', '⏳', 'Waiting for cookies to be set...');
          setTimeout(() => {
            console.log('🔄 Redirecting to dashboard after sign in...');
            addTestResult('Redirect', '🔄', 'Redirecting to /dashboard');
            setDebugInfo(prev => ({ ...prev, redirectAttempts: prev.redirectAttempts + 1 }));
            router.push('/dashboard');
            router.refresh();
          }, 1000);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          addTestResult('Sign Out', 'ℹ️', 'User signed out successfully');
          setAuthState({
            isLoading: false,
            session: null,
            user: null,
            error: null,
          });
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed successfully');
          addTestResult('Token Refresh', '✅', 'Session token refreshed');
          setAuthState(prev => ({ ...prev, session, user: session?.user }));
        } else if (event === 'USER_UPDATED') {
          console.log('👤 User information updated');
          addTestResult('User Update', 'ℹ️', 'User information updated');
          setAuthState(prev => ({ ...prev, session, user: session?.user }));
        }
      }
    );

    addTestResult('Auth Listener', '⏳', 'Initializing auth state listener...');

    return () => {
      console.log('🔌 Unsubscribing from auth listener');
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Manual sign out for testing
  const handleSignOut = async () => {
    console.log('🚪 Manually signing out...');
    addTestResult('Manual Sign Out', '⏳', 'Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Sign out error:', error);
      addTestResult('Manual Sign Out', '❌', `Error: ${error.message}`);
      setAuthState(prev => ({ ...prev, error: error.message }));
    } else {
      addTestResult('Manual Sign Out', '✅', 'Signed out successfully');
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  if (authState.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Checking authentication...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔐 Authentication Test Suite
          </h1>
          <p className="text-gray-600">
            Comprehensive testing dashboard for Supabase authentication
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration & State */}
          <div className="space-y-6">
            {/* Configuration Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                ⚙️ Configuration
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className={debugInfo.supabaseUrl && debugInfo.supabaseUrl !== 'NOT SET' ? 'text-2xl' : 'text-2xl'}>
                    {debugInfo.supabaseUrl && debugInfo.supabaseUrl !== 'NOT SET' ? '✅' : '❌'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-700">Supabase URL</div>
                    <div className="text-xs text-gray-500 truncate font-mono">
                      {debugInfo.supabaseUrl}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{debugInfo.hasAnonKey ? '✅' : '❌'}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-700">Anon Key</div>
                    <div className="text-xs text-gray-500">
                      {debugInfo.hasAnonKey ? 'Configured' : 'NOT SET'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">
                    {debugInfo.authListenerActive ? '✅' : '⏳'}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-700">Auth Listener</div>
                    <div className="text-xs text-gray-500">
                      {debugInfo.authListenerActive ? 'Active' : 'Initializing'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current State */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                📊 Current State
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={authState.session ? 'text-2xl' : 'text-2xl'}>
                      {authState.session ? '✅' : '⭕'}
                    </span>
                    <span className="font-semibold text-sm">
                      Session: {authState.session ? 'Active' : 'None'}
                    </span>
                  </div>
                  {authState.user && (
                    <div className="space-y-1 text-xs text-gray-600 ml-9">
                      <div><strong>Email:</strong> {authState.user.email}</div>
                      <div><strong>ID:</strong> {authState.user.id.slice(0, 12)}...</div>
                      <div><strong>Provider:</strong> {authState.user.app_metadata?.provider || 'email'}</div>
                    </div>
                  )}
                </div>

                {debugInfo.lastEvent && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs font-semibold text-blue-900 mb-1">Last Event</div>
                    <div className="text-xs text-blue-700">{debugInfo.lastEvent}</div>
                    <div className="text-xs text-blue-600 mt-1">{debugInfo.eventTimestamp}</div>
                  </div>
                )}

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs font-semibold text-purple-900 mb-1">Redirects</div>
                  <div className="text-2xl font-bold text-purple-700">{debugInfo.redirectAttempts}</div>
                </div>

                {authState.error && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-xs font-semibold text-red-900 mb-1">❌ Error</div>
                    <div className="text-xs text-red-700">{authState.error}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Column - Auth UI or Session Info */}
          <div className="lg:col-span-2">
            {authState.session ? (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-5xl">✅</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Authentication Successful!
                  </h2>
                  <p className="text-gray-600 mb-2">
                    Signed in as <strong>{authState.user?.email}</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    Provider: {authState.user?.app_metadata?.provider || 'email'}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div>
                      <div className="font-semibold text-blue-900 text-sm mb-1">
                        Redirect Status
                      </div>
                      <div className="text-sm text-blue-700">
                        {debugInfo.redirectAttempts > 0 
                          ? `Attempted ${debugInfo.redirectAttempts} redirect${debugInfo.redirectAttempts > 1 ? 's' : ''} to dashboard`
                          : 'No redirects attempted yet'}
                      </div>
                      {debugInfo.redirectAttempts > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          If you're still here, there may be a middleware or routing issue
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      addTestResult('Manual Redirect', '⏳', 'User clicked manual redirect');
                      router.push('/dashboard');
                      router.refresh();
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg font-semibold text-lg"
                  >
                    🚀 Go to Dashboard Manually
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    🚪 Sign Out (Test)
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center mb-6">
                  Sign In to Continue
                </h2>
                <Auth
                  supabaseClient={supabase}
                  appearance={{ 
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: '#3b82f6',
                          brandAccent: '#2563eb',
                        },
                      },
                    },
                  }}
                  providers={['google', 'github']}
                  redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
                  onlyThirdPartyProviders={false}
                />
              </div>
            )}

            {/* Test Results Log */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  📝 Test Results Log
                </h2>
                <button
                  onClick={clearTestResults}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition"
                >
                  Clear
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {testResults.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    No test results yet
                  </div>
                ) : (
                  testResults.map((result, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm border border-gray-200">
                      <span className="text-lg flex-shrink-0">{result.status}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{result.test}</div>
                        {result.details && (
                          <div className="text-xs text-gray-600 mt-1">{result.details}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">{result.timestamp}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            🧪 Testing Instructions
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Before Testing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Verify all configuration items show ✅</li>
                <li>Open Browser DevTools (F12) Console tab</li>
                <li>Check Test Results Log is ready</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">During Testing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Try signing in with email or OAuth</li>
                <li>Watch console for detailed logs</li>
                <li>Monitor redirect attempts counter</li>
                <li>Check if auto-redirect to dashboard works</li>
                <li>Use manual redirect if needed</li>
                <li>Test sign out and sign in again</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}