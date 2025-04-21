'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import useAuthStore from '@/app/stores/authStore';
import { ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { 
    login, 
    googleLogin, 
    isAuthenticated, 
    isLoginLoading, 
    isGoogleLoginLoading, 
    error, 
    clearError 
  } = useAuthStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [oauthError, setOauthError] = useState(null);

  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode) {
      const errorMessages = {
        no_code: 'Authentication failed: No authorization code received',
        token_exchange: 'Authentication failed: Could not exchange code for tokens',
        user_info: 'Authentication failed: Could not retrieve user information',
        db_error: 'Authentication failed: Database error',
        oauth_failed: 'Authentication failed: OAuth process failed',
        oauth_init_failed: 'Authentication failed: Could not initialize OAuth'
      };
      setOauthError(errorMessages[errorCode] || 'Authentication failed');
    }
  }, [searchParams]);

  useEffect(() => {
    if (error || oauthError) {
      clearError();
      setOauthError(null);
    }
  }, [formData, clearError, error, oauthError]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    clearError();
    try {
      await login(formData);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleGoogleLogin = () => {
    googleLogin(redirectTo);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <div className="hidden md:flex md:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-red)] to-[var(--primary-red-hover)] opacity-90" />
        <div className="absolute inset-0 bg-[url('/images/auth-background.jpg')] bg-cover bg-center mix-blend-overlay" />
        <div className="relative p-12 text-white h-full flex flex-col justify-center z-10">
          <h1 className="text-4xl font-bold mb-6">Welcome Back</h1>
          <p className="text-xl mb-8 max-w-md">
            Sign in to access your account and continue your journey with us.
          </p>
          <div className="flex space-x-3 mt-6">
            <span className="h-2 w-12 bg-white rounded-full opacity-70" />
            <span className="h-2 w-2 bg-white rounded-full opacity-40" />
            <span className="h-2 w-2 bg-white rounded-full opacity-40" />
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Image
              src="/svg/red-logo.svg"
              alt="Logo"
              width={40}
              height={40}
              className="mx-auto mb-2"
            />
            <h2 className="text-3xl font-bold text-gray-900 mt-6 mb-1">Sign In</h2>
            <p className="text-gray-600">Welcome back, please enter your details</p>
          </div>

          {(error || oauthError) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
              <AlertCircle className="text-red-500 mr-2 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-700">{error || oauthError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] outline-none transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] outline-none transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoginLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[var(--primary-red)] hover:bg-[var(--primary-red-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-red)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoginLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2" size={18} />
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoginLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGoogleLoginLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in with Google...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path
                        fill="#4285F4"
                        d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                      />
                      <path
                        fill="#34A853"
                        d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                      />
                    </g>
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-base text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="font-medium text-[var(--primary-red)] hover:text-[var(--primary-red-hover)]">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}