'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useAuthStore from '@/app/stores/authStore';

/**
 * Hook to handle Google OAuth callback and authentication flow
 * @param {Object} options - Configuration options
 * @param {string} options.successRedirect - Path to redirect after successful auth
 * @param {string} options.errorRedirect - Path to redirect on auth error
 * @returns {Object} Authentication state and error message
 */
export default function useGoogleAuth({ 
  successRedirect = '/dashboard', 
  errorRedirect = '/login'
} = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading, error, handleGoogleCallback, clearError } = useAuthStore();

  // Parse error message if present in URL
  const errorParam = searchParams.get('error');
  const errorMessages = {
    'oauth_init_failed': 'Failed to start Google login. Please try again.',
    'no_code': 'Google login failed. No authorization code received.',
    'token_exchange': 'Failed to authenticate with Google. Please try again.',
    'user_info': 'Could not retrieve user information from Google.',
    'db_error': 'Database error occurred. Please try again.',
    'update_error': 'Failed to update user information.',
    'create_error': 'Failed to create user account.',
    'oauth_failed': 'Google authentication failed. Please try again.'
  };

  const errorMessage = errorParam ? (errorMessages[errorParam] || 'Authentication error') : error;

  // Handle Google callback
  useEffect(() => {
    const code = searchParams.get('code');
    const authError = searchParams.get('error');
    
    if (code) {
      // We have a code, process the Google callback
      handleGoogleCallback().then(() => {
        router.push(successRedirect);
      }).catch(() => {
        router.push(errorRedirect);
      });
    } else if (authError) {
      // Google OAuth returned an error
      router.push(`${errorRedirect}?error=${authError}`);
    }
  }, [searchParams, handleGoogleCallback, router, successRedirect, errorRedirect]);

  return {
    isAuthenticated,
    isLoading,
    errorMessage,
    clearError
  };
}