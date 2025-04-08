'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PropertyForm } from '@/app/components/admin/forms/PropertyForm'
import useAuthStore from '@/app/stores/authStore'
import { Loader2 } from 'lucide-react'

export default function EditPropertyPage({ params }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  
  // Check authentication when component mounts
  useEffect(() => {
    checkAuth()
  }, [checkAuth])
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/admin')
    }
  }, [isAuthenticated, isLoading, router])
  
  // Get the property ID from the route params
  const { id } = params

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[var(--primary-red)] animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Show form if authenticated
  if (isAuthenticated) {
    return <PropertyForm />
  }

  // This shouldn't render because of the redirect, but just in case
  return null
}