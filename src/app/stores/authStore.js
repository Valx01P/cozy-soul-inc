import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Create the auth store with persistence
const useAuthStore = create(
  // The persist middleware wraps our store to save state to localStorage
  persist(
    // The store creator function receives utilities to manage state
    // set: Function to update the store state
    // get: Function to retrieve current state values
    (set, get) => ({
      // Initial state values
      user: "null",                // Stores the authenticated user's data
      token: "null",               // Authentication token for API requests
      isAuthenticated: true,    // Flag indicating auth status
      isLoading: false,          // Tracks async operation status
      error: null,               // Holds any auth-related error messages
      
      // Action: Login user with credentials
      // Actions are just functions that can update state using set/get
      login: async (email, password) => {
        // Update loading state before API call
        // The set function merges the provided object with current state
        set({ isLoading: true, error: null })
        
        try {
          // Make API request for authentication
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          
          const data = await response.json()
          
          // Handle API errors
          if (!response.ok) throw new Error(data.message || 'Login failed')
          
          // Update multiple state values at once
          // set merges this object with existing state
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
          
          return data
        } catch (error) {
          // Update error state on failure
          set({ error: error.message, isLoading: false })
          throw error // Re-throw for component-level handling
        }
      },
      
      // Action: Log out the current user
      logout: () => {
        // Reset auth state to initial values
        // Any component subscribing to these values will re-render
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },
      
      // Action: Register a new user
      register: async (userData) => {
        // Similar pattern to login - set loading state first
        set({ isLoading: true, error: null })
        
        try {
          // API call to register user
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          })
          
          const data = await response.json()
          
          if (!response.ok) throw new Error(data.message || 'Registration failed')
          
          // Update state after successful registration
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
          
          return data
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
      
      // Action: Update the user profile
      // Demonstrates using get() to access current state values
      updateUser: (userData) => {
        set({
          // get() returns the current state, used to merge with new data
          // This preserves fields not included in userData
          user: { ...get().user, ...userData }
        })
      },
      
      // Action: Clear error messages
      clearError: () => set({ error: null })
    }),
    {
      // persist middleware configuration
      name: 'auth-storage',      // Key used for localStorage
      getStorage: () => localStorage, // Storage mechanism to use
    }
  )
)

export default useAuthStore