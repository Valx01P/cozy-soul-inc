'use client';

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import authService from '@/app/services/api/authService'
import userService from '@/app/services/api/userService'

// Create the auth store with persistence
const useAuthStore = create(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      // New specific loading states
      isLoginLoading: false,
      isSignupLoading: false,
      isGoogleLoginLoading: false,
      error: null,
      
      login: async (loginData) => {
        set({ isLoginLoading: true, isLoading: true, error: null })
        
        try {
          const userData = await authService.login(loginData)
          
          set({
            user: {
              id: userData.id,
              first_name: userData.first_name,
              last_name: userData.last_name,
              email: userData.email,
              role: userData.role,
              email_verified: userData.email_verified,
              identity_verified: userData.identity_verified,
              profile_image: userData.profile_image,
              created_at: userData.created_at,
              updated_at: userData.updated_at
            },
            isAuthenticated: true,
            isLoginLoading: false,
            isLoading: false
          })
          
          return userData
        } catch (error) {
          set({ error: error.message, isLoginLoading: false, isLoading: false })
          throw error
        }
      },
      
      googleLogin: (redirectTo = '/') => {
        set({ isGoogleLoginLoading: true, error: null })
        // Only set the Google-specific loading state, not the global one
        // since we're redirecting immediately
        authService.googleLogin(redirectTo)
      },
      
      handleGoogleCallback: async () => {
        // This is called after returning from Google OAuth
        // Check auth status to update user state
        return await get().checkAuth()
      },

      signup: async (signUpData) => {
        set({ isSignupLoading: true, isLoading: true, error: null })
        
        try {
          const user = await authService.signup(signUpData)
          
          // Update state with user data
          set({
            user: {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              role: user.role,
              email_verified: user.email_verified,
              identity_verified: user.identity_verified,
              profile_image: user.profile_image,
              created_at: user.created_at,
              updated_at: user.updated_at
            },
            isAuthenticated: true,
            isSignupLoading: false,
            isLoading: false
          })
          
          return user
        } catch (error) {
          set({ error: error.message, isSignupLoading: false, isLoading: false })
          throw error
        }
      },
      
      logout: async () => {
        set({ isLoading: true })
        
        try {
          await authService.logout()
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isLoginLoading: false,
            isSignupLoading: false,
            isGoogleLoginLoading: false,
            error: null
          })
          
          localStorage.removeItem('auth-storage')
          
          return true
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      // used in AuthProvider.js
      checkAuth: async () => {
        if (get().isLoading) return
        
        set({ isLoading: true })
        
        try {
          const userData = await userService.getMe()
          
          set({
            user: {
              id: userData.id,
              first_name: userData.first_name,
              last_name: userData.last_name,
              email: userData.email,
              role: userData.role,
              email_verified: userData.email_verified,
              identity_verified: userData.identity_verified,
              profile_image: userData.profile_image,
              created_at: userData.created_at,
              updated_at: userData.updated_at
            },
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
        } catch (error) {
          
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          })
          
          throw error
        }
      },
      
      // used in AuthProvider.js
      refreshToken: async () => {
        if (!get().isAuthenticated) return false
        
        try {
          await authService.refresh()
          return true
        } catch (error) {

          set({
            user: null,
            isAuthenticated: false,
            error: null
          })
          
          localStorage.removeItem('auth-storage')
          
          return false
        }
      },
      
      verifyEmail: async (code) => {
        set({ isLoading: true, error: null })
        
        try {
          const userData = await authService.verifyEmail(code)
          
          set({
            user: {
              ...get().user,
              email_verified: true,
              ...userData
            },
            isLoading: false
          })
          
          return userData
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
      
      clearError: () => set({ error: null }),

      updateProfile: async (profileUpdateData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Send the update data (which may include the profile_image URL)
          const userData = await userService.updateMe(profileUpdateData);
          
          // Update the user state with the returned data
          set({
            user: {
              ...get().user,
              ...userData
            },
            isLoading: false
          });
          
          return userData;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // New function to upload profile image
      uploadProfileImage: async (imageFile) => {
        try {
          const formData = new FormData();
          formData.append('image', imageFile);
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/upload/profile`, {
            method: 'POST',
            credentials: 'include',
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload profile image');
          }
          
          const data = await response.json();
          return data.url;
        } catch (error) {
          console.error('Error uploading profile image:', error);
          throw error;
        }
      },
      
      // New function to delete profile image
      deleteProfileImage: async (imageUrl) => {
        try {
          // Extract filename from URL
          const filepath = imageUrl;
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/upload/profile`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filepath })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete profile image');
          }
          
          return true;
        } catch (error) {
          console.error('Error deleting profile image:', error);
          throw error;
        }
      }
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