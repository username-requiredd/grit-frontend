"use client"
import React, { useState } from 'react';
import { Loader2, ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Email address is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      console.log('[DEBUG] Sending forgot-password request for:', email);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('[DEBUG] Forgot-password response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process password reset request');
      }
      
      setEmailSent(true);
      
    } catch (err: any) {
      console.error('[DEBUG] Forgot-password error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-dark-primary mb-2">Check your email</h1>
            <p className="text-sm text-gray-600 dark:text-dark-secondary">
              We've sent a password reset link to{' '}
              <span className="font-medium text-gray-900 dark:text-dark-primary">{email}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-dark-elevated border border-gray-200 dark:border-dark-border rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-dark-primary mb-2">What's next?</p>
              <ul className="text-xs text-gray-600 dark:text-dark-secondary space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Open the email from noreply@grit.app</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Click the password reset link</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Create a new password</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> The reset link expires in 1 hour. If you don't receive the email, check your spam folder or request a new link.
              </p>
            </div>

            <button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
                setError('');
              }}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Didn't receive the email? Try another
            </button>

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
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-dark-primary mb-2">Forgot password?</h1>
          <p className="text-sm text-gray-600 dark:text-dark-secondary">
            No worries. Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
          {error && (
            <div className="flex items-start gap-3 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-primary mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setError('');
                setEmail(e.target.value);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm bg-white dark:bg-dark-elevated text-gray-900 dark:text-dark-primary placeholder:text-gray-500 dark:placeholder:text-dark-secondary transition-colors"
              disabled={isLoading}
              aria-label="Email address"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending reset link...
              </span>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
          <p className="text-xs text-center text-gray-600 dark:text-dark-secondary">
            Don't have an account?{' '}
            <Link href="/sign-up" className="text-black dark:text-white font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;