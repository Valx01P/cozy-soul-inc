'use client';
import { useEffect } from 'react';
import useAuthStore from '../../stores/authStore'

// This component initializes authentication on page load 
// and handles token refreshing at regular intervals
export default function AuthInitializer({ children }) {
  const { checkAuth, refreshToken, isAuthenticated } = useAuthStore();

  // Check authentication status on initial load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Set up token refresh interval
  useEffect(() => {
    // Only set up refresh for authenticated users
    if (!isAuthenticated) return;
    
    // Refresh token function that will be called periodically
    const handleTokenRefresh = async () => {
      await refreshToken();
    };
    
    // Set up initial refresh check
    const initialCheck = setTimeout(handleTokenRefresh, 1000);
    
    // Set up periodic refresh (every 10 minutes)
    // This is to ensure the token stays valid while the user is active
    const refreshInterval = setInterval(handleTokenRefresh, 10 * 60 * 1000);
    
    // Cleanup
    return () => {
      clearTimeout(initialCheck);
      clearInterval(refreshInterval);
    };
  }, [isAuthenticated, refreshToken]);

  return <>{children}</>;
}