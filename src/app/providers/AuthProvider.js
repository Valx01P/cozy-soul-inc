'use client';

import { useEffect, useState } from 'react'
import useAuthStore from '@/app/stores/authStore'

/**
 * AuthProvider component that properly handles token refresh
 * and maintains user session as long as refresh token is valid
 */
export default function AuthProvider({ children }) {
  const { checkAuth, refreshToken, isAuthenticated, user } = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        // Always attempt to refresh tokens on initialization
        // This will update the tokens with the latest role from the database
        await refreshToken()
        
        // Then check auth to update the user state
        await checkAuth()
      } catch (error) {
        console.error("Auth initialization error:", error)
        // Even if refresh fails, still try to check auth
        try {
          await checkAuth()
        } catch (checkError) {
          console.error("Auth check error after refresh failure:", checkError)
        }
      } finally {
        setIsInitialized(true)
      }
    }

    initialize()
  }, [refreshToken, checkAuth])

  useEffect(() => {
    if (!isInitialized) return
    
    if (!isAuthenticated) return
        
    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken() // automatically handles logout if refresh token is invalid
      } catch (error) {
        console.error("Token refresh error:", error)
      }
    }, 9 * 60 * 1000) // Refresh token every 9 minutes
    
    return () => clearInterval(refreshInterval)
  }, [isAuthenticated, isInitialized, refreshToken])

  return children
}