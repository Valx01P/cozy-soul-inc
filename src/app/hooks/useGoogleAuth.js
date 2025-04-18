'use client';

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import useAuthStore from '@/app/stores/authStore'
import { getOAuthErrorMessage } from '@/app/lib/errorHandler'

export default function useGoogleAuth({
  successRedirect='/', 
  errorRedirect='/login'
} = {}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated, isLoading, error, handleGoogleCallback, clearError } = useAuthStore()

  // Get error message from URL param
  const errorParam = searchParams.get('error')
  const errorMessage = errorParam ? getOAuthErrorMessage(errorParam) : error

  // Handle callback
  useEffect(() => {
    const code = searchParams.get('code')
    const authError = searchParams.get('error')
    
    if (code) {
      // Process Google callback
      handleGoogleCallback()
        .then(() => router.push(successRedirect))
        .catch(() => router.push(errorRedirect))
    } else if (authError) {
      // Handle error
      router.push(`${errorRedirect}?error=${authError}`)
    }
  }, [searchParams, handleGoogleCallback, router, successRedirect, errorRedirect])

  return { isAuthenticated, isLoading, errorMessage, clearError }
}