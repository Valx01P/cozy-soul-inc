'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useAuthStore from '@/app/stores/authStore'
import useGoogleAuth from '@/app/hooks/useGoogleAuth'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login, googleLogin, isAuthenticated, isLoading, error, clearError } = useAuthStore()
  // Our simplified hook manages OAuth errors and state
  const { errorMessage } = useGoogleAuth({ successRedirect: '/' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) router.push('/')
  }, [isAuthenticated, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    try {
      await login(email, password)
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  // Handle Google login - now much simpler
  const handleGoogleLogin = () => {
    googleLogin('/')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
          </div>
          
          {/* Error message handling - now using our centralized error system */}
          {(error || errorMessage) && (
            <div className="bg-red-50 border-l-4 border-[var(--primary-red)] p-3 rounded">
              <p className="text-sm text-red-700">{error || errorMessage}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 border rounded focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)]"
              />
            </div>
            
            {/* Password input with toggle visibility */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 border rounded focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between">
              <Link href="/forgot-password" className="text-sm text-[var(--primary-red)]">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full p-2 bg-[var(--primary-red)] text-white rounded disabled:opacity-70"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          
          {/* Or separator */}
          <div>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>
            
            {/* Google login button - now using our simplified method */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full p-2 border rounded flex justify-center items-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
          
          {/* Sign up link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              No account?{' '}
              <Link href="/signup" className="text-[var(--primary-red)]">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Image panel - only on large screens */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-[var(--primary-red)] opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative p-8 text-white h-full flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-4">Welcome Back</h1>
          <p className="mb-4">Log in to access your account</p>
        </div>
      </div>
    </div>
  )
}