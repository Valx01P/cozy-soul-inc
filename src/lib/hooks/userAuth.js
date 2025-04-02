'use client';

import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

// Create auth context
const AuthContext = createContext();

// Provider component that wraps the app and makes auth available
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if access token exists and is valid on mount
  useEffect(() => {
    async function loadUserFromCookies() {
      const accessToken = Cookies.get('access_token');
      
      if (accessToken) {
        try {
          // Decode the token to get admin info
          const decoded = jwtDecode(accessToken);
          
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            // Token expired, try to refresh
            await refreshToken();
          } else {
            // Fetch admin data from API
            const response = await fetch('/api/auth/me');
            
            if (response.ok) {
              const data = await response.json();
              setAdmin(data.admin);
            } else {
              setAdmin(null);
            }
          }
        } catch (error) {
          console.error('Error decoding token or fetching admin:', error);
          setAdmin(null);
        }
      }
      
      setLoading(false);
    }
    
    loadUserFromCookies();
  }, []);
  
  // Function to refresh the token
  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // After refreshing, fetch admin data
        const adminResponse = await fetch('/api/auth/me');
        
        if (adminResponse.ok) {
          const data = await adminResponse.json();
          setAdmin(data.admin);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };
  
  // Login function
  const login = async (email, password) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
        setLoading(false);
        return { success: true };
      } else {
        const error = await response.json();
        setLoading(false);
        return { success: false, error: error.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
      
      // Remove admin from state
      setAdmin(null);
      
      // Redirect to login page
      router.push('/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      isAuthenticated: !!admin,
      admin,
      loading,
      login,
      logout,
      refreshToken
    }),
    [admin, loading]
  );
  
  // Provide the auth context to the children
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for components to get the auth context
export const useAuth = () => useContext(AuthContext);

// Custom hook to protect admin routes
export function useRequireAuth(redirectUrl = '/admin') {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, loading, redirectUrl, router]);
  
  return { isAuthenticated, loading };
}