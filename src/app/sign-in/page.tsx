"use client";

import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';

const SignIn = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // FIX 1: separate loading state for Google button
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // FIX 2: "Remember me" now has proper state
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // FIX 3: helper to update fields and clear stale errors on input change
  const handleFieldChange = (field: 'email' | 'password', value: string) => {
    console.log(`[DEBUG] Field changed: ${field}`, value);
    setError('');
    setLoginData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('[DEBUG] handleLogin triggered');

    if (!loginData.email || !loginData.password) {
      console.log('[DEBUG] Validation failed: missing email or password');
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('[DEBUG] Calling NextAuth signIn with credentials...', { email: loginData.email });
      const result = await signIn('credentials', {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      });

      console.log('[DEBUG] NextAuth signIn result:', result);

      if (result?.error) {
        console.error('[DEBUG] Login failed with error:', result.error);
        setError(
          result.error === 'CredentialsSignin'
            ? 'Invalid email or password'
            : result.error
        );
        return;
      }

      console.log('[DEBUG] Login successful. Fetching session to determine role...');
      
      // Fetch the updated session directly to route securely based on DB Role
      const session = await getSession();
      
      if (session?.user?.role === 'ADMIN') {
        console.log('[DEBUG] Admin user detected. Redirecting to /admin');
        router.push('/admin');
      } else {
        console.log('[DEBUG] Standard user detected. Redirecting to /board');
        router.push('/board');
      }
      
      // Force Next.js Router cache to hydrate the session on layout components
      router.refresh(); 

    } catch (err: unknown) { // FIX 5: unknown instead of any
      console.error('[DEBUG] Exception caught in handleLogin:', err);
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsLoading(false);
      console.log('[DEBUG] handleLogin finished executing');
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('[DEBUG] handleGoogleSignIn triggered');
    setIsGoogleLoading(true); // FIX 1 continued: show loading on Google button
    setError('');
    
    try {
      console.log('[DEBUG] Calling NextAuth signIn with Google provider...');
      await signIn('google', {
        // NextAuth will handle the callback URL automatically based on middleware,
        // but you can default to /board which middleware will override if they are an admin.
        callbackUrl: '/board', 
      });
      // Note: signIn with redirect will navigate away; setIsGoogleLoading(false) is
      // intentionally omitted here — the page will unmount on success.
    } catch (err: unknown) { // FIX 5 continued: unknown instead of any
      console.error('[DEBUG] Exception caught in handleGoogleSignIn:', err);
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(message);
      setIsGoogleLoading(false);
    }
  };

  const isAnyLoading = isLoading || isGoogleLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-dark-primary mb-2">Sign in</h1>
          <p className="text-sm text-gray-600 dark:text-dark-secondary">Welcome back</p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              {error}
            </div>
          )}

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            type="button"
            disabled={isAnyLoading} // FIX 1 continued: disable during any loading state
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-dark-primary">
              {isGoogleLoading ? 'Redirecting...' : 'Continue with Google'}
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-dark-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-dark-bg text-gray-500 dark:text-dark-secondary">or</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3" noValidate>
            <div>
              <input
                type="email"
                name="email"           // FIX 6: name attribute for form semantics
                autoComplete="email"   // FIX 7: autoComplete for browser autofill
                placeholder="Email"
                value={loginData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)} // FIX 3
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm bg-white dark:bg-dark-elevated text-gray-900 dark:text-dark-primary placeholder:text-gray-500 dark:placeholder:text-dark-secondary"
                disabled={isAnyLoading}
                aria-label="Email address"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"                                          // FIX 6
                autoComplete="current-password"                          // FIX 7
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)} // FIX 3
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm bg-white dark:bg-dark-elevated text-gray-900 dark:text-dark-primary placeholder:text-gray-500 dark:placeholder:text-dark-secondary"
                disabled={isAnyLoading}
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-secondary hover:text-gray-600 dark:hover:text-dark-primary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              {/* FIX 2: "Remember me" now has real state wired up */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    console.log('[DEBUG] Remember me toggled:', e.target.checked);
                    setRememberMe(e.target.checked);
                  }}
                  className="w-4 h-4 rounded border-gray-300 dark:border-dark-border dark:bg-dark-elevated"
                />
                <span className="text-gray-600 dark:text-dark-secondary">Remember me</span>
              </label>
              {/* FIX 8: removed invalid type="button" from Link (renders as <a>) */}
              <Link
                href="/forgot-password"
                className="text-gray-900 dark:text-dark-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isAnyLoading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-dark-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-gray-900 dark:text-dark-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;