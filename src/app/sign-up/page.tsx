"use client";

import { EyeOff, Eye, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

// ─── Error maps ───────────────────────────────────────────────────────────────

const REGISTER_ERRORS: Record<string, string> = {
  'email already exists':
    'An account with this email already exists. Try signing in, or use "Forgot password" if you\'ve lost access.',
  'email must be an email':
    'Enter a valid email address (e.g. you@example.com).',
  'password is too weak':
    'Your password is too weak. Use at least 8 characters with a mix of letters, numbers, and symbols.',
  'password is too short':
    'Password must be at least 8 characters long.',
  'invalid email or password':
    'The email or password you entered is invalid. Please check and try again.',
  Default:
    'Registration failed. Please try again, or contact support if the problem persists.',
};

const GOOGLE_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    'This email is already registered with a password. Sign in with your email and password instead.',
  OAuthSignInError:
    'Google sign-up failed. This may be a temporary issue — please try again in a moment.',
  OAuthCallbackError:
    'We couldn\'t complete the Google sign-up. Please allow popups for this site and try again.',
  Default:
    'Something went wrong with Google sign-up. Please try again.',
};

const getRegisterError = (message: string | string[] | undefined, errorField?: string): string => {
  const raw = Array.isArray(message) ? message[0] : message ?? errorField ?? '';
  const normalised = raw.toLowerCase();
  const match = Object.keys(REGISTER_ERRORS).find(key => normalised.includes(key));
  return match ? REGISTER_ERRORS[match] : raw || REGISTER_ERRORS.Default;
};

const getGoogleError = (code: string | undefined): string => {
  if (!code) return GOOGLE_ERRORS.Default;
  return GOOGLE_ERRORS[code] ?? `Google sign-up failed (${code}). Please try again or contact support.`;
};

const getNetworkError = (err: unknown): string => {
  if (!(err instanceof Error)) return REGISTER_ERRORS.Default;
  if (err.message.toLowerCase().includes('failed to fetch') || err.message.includes('network')) {
    return 'Unable to reach the server. Check your internet connection and try again.';
  }
  if (err.message.includes('timeout')) {
    return 'The request timed out. Your connection may be slow — please try again.';
  }
  return err.message || REGISTER_ERRORS.Default;
};

// ─── Password strength ────────────────────────────────────────────────────────

type StrengthLevel = 'weak' | 'fair' | 'strong';

const getPasswordStrength = (password: string): { level: StrengthLevel; label: string; width: string; color: string } => {
  if (password.length === 0) return { level: 'weak', label: '', width: '0%', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 'weak',   label: 'Weak',   width: '33%',  color: 'bg-red-400' };
  if (score <= 3) return { level: 'fair',   label: 'Fair',   width: '66%',  color: 'bg-yellow-400' };
  return            { level: 'strong', label: 'Strong', width: '100%', color: 'bg-green-400' };
};

// ─── Component ────────────────────────────────────────────────────────────────

const SignUpPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '', confirmPassword: '' });

  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const passwordStrength = getPasswordStrength(signupData.password);

  const handleFieldChange = (field: 'email' | 'password' | 'confirmPassword', value: string) => {
    console.log(`[DEBUG] Field changed: ${field}`, value);
    setError('');
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
    setSignupData(prev => ({ ...prev, [field]: value }));
  };

  const validateFields = (): boolean => {
    console.log('[DEBUG] Validating fields...', signupData);
    const errors = { email: '', password: '', confirmPassword: '' };
    let valid = true;

    if (!signupData.email) {
      errors.email = 'Email address is required.';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) {
      errors.email = 'Enter a valid email address (e.g. you@example.com).';
      valid = false;
    }

    if (!signupData.password) {
      errors.password = 'Password is required.';
      valid = false;
    } else if (signupData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
      valid = false;
    } else if (passwordStrength.level === 'weak') {
      errors.password = 'Password is too weak. Add uppercase letters, numbers, or symbols.';
      valid = false;
    }

    if (!signupData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
      valid = false;
    } else if (signupData.password !== signupData.confirmPassword) {
      errors.confirmPassword = 'Passwords don\'t match. Please re-enter your password.';
      valid = false;
    }

    setFieldErrors(errors);
    console.log('[DEBUG] Validation result:', { valid, errors });
    return valid;
  };

  const extractErrorMessage = (data: { message?: string | string[]; error?: string }): string => {
    return getRegisterError(data.message, data.error);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('[DEBUG] handleSignup triggered');
    
    if (!validateFields()) {
      console.log('[DEBUG] Validation failed. Aborting signup.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log(`[DEBUG] Sending POST request to ${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupData.email,
          password: signupData.password,
        }),
      });

      const data = await response.json();
      console.log('[DEBUG] Registration API response:', { status: response.status, data });

      if (!response.ok) {
        console.error('[DEBUG] Registration failed. Extracting error message...');
        throw new Error(extractErrorMessage(data));
      }

      console.log('[DEBUG] Registration successful. Attempting to sign in automatically...');
      
      // Check if backend returned JWT directly (new optimized path)
      if (data.access_token) {
        console.log('[DEBUG] Backend returned JWT directly. Using credentials provider to establish session...');
      }
      
      // Always use signIn('credentials') to establish NextAuth session properly
      const result = await signIn('credentials', {
        email: signupData.email,
        password: signupData.password,
        redirect: false,
      });

      console.log('[DEBUG] NextAuth signIn result:', result);

      if (result?.error) {
        console.error('[DEBUG] NextAuth signIn failed after successful registration:', result.error);
        setError(
          result.error === 'CredentialsSignin' 
            ? 'Your account was created successfully. Please sign in with your credentials on the sign-in page.'
            : `Your account was created successfully, but authentication failed: ${result.error}. Please try signing in.`
        );
        return;
      }

      console.log('[DEBUG] Full signup flow complete. Redirecting to /board');
      router.push('/board');
    } catch (err: unknown) {
      console.error('[DEBUG] Exception caught in handleSignup:', err);
      setError(getNetworkError(err));
    } finally {
      setIsLoading(false);
      console.log('[DEBUG] handleSignup finished executing');
    }
  };

  const handleGoogleSignUp = async () => {
    console.log('[DEBUG] handleGoogleSignUp triggered');
    setIsGoogleLoading(true);
    setError('');
    
    try {
      console.log('[DEBUG] Calling NextAuth signIn with Google provider...');
      await signIn('google', { callbackUrl: '/board' });
      // Page unmounts on success — no need to reset loading state
    } catch (err: unknown) {
      console.error('[DEBUG] Exception caught in handleGoogleSignUp:', err);
      const code = err instanceof Error ? err.message : undefined;
      setError(getGoogleError(code));
      setIsGoogleLoading(false);
    }
  };

  const isAnyLoading = isLoading || isGoogleLoading;

  // Shared input class builder
  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm 
     bg-white dark:bg-dark-elevated text-gray-900 dark:text-dark-primary 
     placeholder:text-gray-500 dark:placeholder:text-dark-secondary transition-colors
     ${hasError
       ? 'border-red-400 dark:border-red-600 focus:ring-red-400'
       : 'border-gray-300 dark:border-dark-border focus:ring-black dark:focus:ring-white'}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-dark-primary mb-2">Create account</h1>
          <p className="text-sm text-gray-600 dark:text-dark-secondary">Get started for free</p>
        </div>

        <div className="space-y-4">

          {/* Global error banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isAnyLoading}
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
              {isGoogleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
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

          <form onSubmit={handleSignup} className="space-y-3" noValidate>

            {/* Email */}
            <div className="space-y-1">
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Email"
                value={signupData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className={inputClass(!!fieldErrors.email)}
                disabled={isAnyLoading}
                aria-label="Email address"
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <p id="email-error" role="alert" className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  placeholder="Password"
                  value={signupData.password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  className={inputClass(!!fieldErrors.password)}
                  disabled={isAnyLoading}
                  aria-label="Password"
                  aria-describedby={fieldErrors.password ? 'password-error' : 'password-strength'}
                  aria-invalid={!!fieldErrors.password}
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

              {/* Password strength bar — only shown when user has typed */}
              {signupData.password.length > 0 && !fieldErrors.password && (
                <div id="password-strength" className="space-y-1">
                  <div className="h-1 w-full bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.level === 'strong' ? 'text-green-500' :
                    passwordStrength.level === 'fair'   ? 'text-yellow-500' : 'text-red-400'
                  }`}>
                    {passwordStrength.label} password
                    {passwordStrength.level !== 'strong' && ' — add uppercase letters, numbers, or symbols to strengthen it.'}
                  </p>
                </div>
              )}

              {fieldErrors.password && (
                <p id="password-error" role="alert" className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  value={signupData.confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  className={inputClass(!!fieldErrors.confirmPassword)}
                  disabled={isAnyLoading}
                  aria-label="Confirm password"
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                  aria-invalid={!!fieldErrors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-secondary hover:text-gray-600 dark:hover:text-dark-primary"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Inline match confirmation when both fields have values and match */}
              {signupData.confirmPassword.length > 0 &&
               signupData.password === signupData.confirmPassword &&
               !fieldErrors.confirmPassword && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  ✓ Passwords match
                </p>
              )}

              {fieldErrors.confirmPassword && (
                <p id="confirm-password-error" role="alert" className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isAnyLoading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-xs text-center text-gray-500 dark:text-dark-secondary">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-gray-900 dark:text-dark-primary hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-gray-900 dark:text-dark-primary hover:underline">Privacy Policy</Link>
          </p>

          <p className="text-center text-sm text-gray-600 dark:text-dark-secondary">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-gray-900 dark:text-dark-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;