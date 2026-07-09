"use client"
import React, { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type PasswordStrength = 'weak' | 'fair' | 'strong';

const ResetPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Invalid or expired reset token. Please request a new password reset link.');
    }
  }, [token]);

  const getPasswordStrength = (): { level: PasswordStrength; score: number } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 'weak', score };
    if (score <= 4) return { level: 'fair', score };
    return { level: 'strong', score };
  };

  const validatePassword = (): string[] => {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return errors;
    }

    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('One number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('One special character');
    }

    return errors;
  };

  const passwordErrors = validatePassword();
  const passwordStrength = getPasswordStrength();
  const isPasswordValid = passwordErrors.length === 0;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (!isPasswordValid) {
      setError("Password does not meet the requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      console.log('[DEBUG] Sending reset-password request');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();
      console.log('[DEBUG] Reset-password response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }
      
      setResetSuccess(true);
      setTimeout(() => {
        router.push('/sign-in');
      }, 2000);
      
    } catch (err: any) {
      console.error('[DEBUG] Reset-password error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-dark-primary mb-2">
            Password reset successful!
          </h1>
          <p className="text-sm text-gray-600 dark:text-dark-secondary mb-6">
            Your password has been updated. Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-dark-primary mb-2">
              Invalid Reset Link
            </h1>
            <p className="text-sm text-gray-600 dark:text-dark-secondary mb-6">
              The password reset link is invalid or has expired.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/forgot-password"
              className="block w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium text-center"
            >
              Request New Reset Link
            </Link>

            <Link
              href="/sign-in"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary transition-colors py-2"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-dark-primary mb-2">
            Set new password
          </h1>
          <p className="text-sm text-gray-600 dark:text-dark-secondary">
            Create a strong password to secure your account
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-primary mb-1.5">
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setError('');
                  setPassword(e.target.value);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm bg-white dark:bg-dark-elevated text-gray-900 dark:text-dark-primary placeholder:text-gray-500 dark:placeholder:text-dark-secondary transition-colors"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-secondary hover:text-gray-600 dark:hover:text-dark-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      passwordStrength.level === 'weak'
                        ? 'w-1/3 bg-red-500'
                        : passwordStrength.level === 'fair'
                          ? 'w-2/3 bg-yellow-500'
                          : 'w-full bg-green-500'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    passwordStrength.level === 'weak'
                      ? 'text-red-600 dark:text-red-400'
                      : passwordStrength.level === 'fair'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {passwordStrength.level.charAt(0).toUpperCase() + passwordStrength.level.slice(1)}
                </span>
              </div>

              {passwordErrors.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-2">Missing requirements:</p>
                  <ul className="space-y-1">
                    {passwordErrors.map((err, idx) => (
                      <li key={idx} className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <span className="text-amber-600 dark:text-amber-400">✗</span>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-dark-primary mb-1.5">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setError('');
                  setConfirmPassword(e.target.value);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm bg-white dark:bg-dark-elevated text-gray-900 dark:text-dark-primary placeholder:text-gray-500 dark:placeholder:text-dark-secondary transition-colors"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-secondary hover:text-gray-600 dark:hover:text-dark-primary transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Password Match Indicator */}
          {confirmPassword && password !== confirmPassword && (
            <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              Passwords do not match
            </div>
          )}

          {confirmPassword && password === confirmPassword && isPasswordValid && (
            <div className="p-3 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              ✓ Passwords match and meet all requirements
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !token || !isPasswordValid || password !== confirmPassword}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetting password...
              </span>
            ) : (
              'Reset password'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border text-center">
          <p className="text-xs text-gray-600 dark:text-dark-secondary">
            Remember your password?{' '}
            <Link href="/sign-in" className="text-black dark:text-white font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
