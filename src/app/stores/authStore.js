import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Create the auth store with persistence
const useAuthStore = create(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Login action
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          
          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.message || 'Login failed')
          }
          
          // Update state with user data, tokens are stored in HTTP-only cookies
          set({
            user: {
              first_name: data.first_name,
              last_name: data.last_name,
              email: data.email,
              username: data.username
            },
            isAuthenticated: true,
            isLoading: false
          })
          
          return data
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
      
      // Logout action
      logout: async () => {
        set({ isLoading: true })
        
        try {
          // Call logout API to clear cookies
          const response = await fetch('/api/auth/logout', {
            method: 'POST'
          })
          
          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.message || 'Logout failed')
          }
          
          // Reset auth state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          })
          
          // Clear local storage persisted state
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-storage')
          }
          
          return true
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
      
      // Check current auth status
      checkAuth: async () => {
        if (get().isLoading) return
        
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include' // Important for cookies
          })
          
          if (!response.ok) {
            // If unauthorized, clear auth state
            if (response.status === 401) {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
              })
              return
            }
            
            const data = await response.json()
            throw new Error(data.message || 'Authentication check failed')
          }
          
          const data = await response.json()
          
          set({
            user: {
              first_name: data.first_name,
              last_name: data.last_name,
              email: data.email,
              username: data.username
            },
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ 
            error: error.message, 
            isLoading: false,
            isAuthenticated: false,
            user: null
          })
        }
      },
      
      // Attempt to refresh the token
      refreshToken: async () => {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include' // Important for cookies
          })
          
          if (!response.ok) {
            // If refresh fails, log the user out
            set({
              user: null,
              isAuthenticated: false,
              error: null
            })
            return false
          }
          
          return true
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            error: null
          })
          return false
        }
      },
      
      // Clear any error messages
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
      partialize: (state) => ({
        // Only persist user data, not loading states or errors
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export default useAuthStore