'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PropertyForm from '@/app/components/admin/forms/PropertyForm'
import useAuthStore from '@/app/stores/authStore'
import usePropertyFormStore from '@/app/stores/propertyFormStore'
import { Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CreatePropertyPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const { setCreateMode, resetForm } = usePropertyFormStore()
  
  // Check authentication when component mounts
  useEffect(() => {
    checkAuth()
  }, [checkAuth])
  
  // Initialize form in create mode and reset form state
  useEffect(() => {
    // Complete reset of form state with a small delay to ensure it's done after component mount
    const timer = setTimeout(() => {
      resetForm() // Clear any previous form data
      setCreateMode() // Set to create mode
      console.log("Form reset and set to create mode")
    }, 100)
    
    return () => clearTimeout(timer)
  }, [resetForm, setCreateMode])
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/admin')
    }
  }, [isAuthenticated, isLoading, router])
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-red)]"></div>
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