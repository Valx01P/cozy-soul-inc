'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react' 
import PropertyForm from '@/app/components/admin/forms/PropertyForm'
import useAuthStore from '@/app/stores/authStore'
import usePropertyFormStore from '@/app/stores/propertyFormStore'
import { AlertCircle } from 'lucide-react'

export default function EditPropertyPage({ params }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const { setEditMode, resetForm } = usePropertyFormStore()
  const [isFetchingProperty, setIsFetchingProperty] = useState(true)
  const [propertyError, setPropertyError] = useState(null)
  
  // Properly unwrap params using React.use()
  const resolvedParams = use(params)
  const { id } = resolvedParams
  
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
  
  // Fetch property data
  useEffect(() => {
    if (!isAuthenticated || !id) return
    
    async function fetchProperty() {
      try {
        resetForm() // Clear any previous form data
        setIsFetchingProperty(true)
        const response = await fetch(`/api/listings/${id}`)
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${await response.text()}`)
        }
        
        const propertyData = await response.json()
        console.log("Fetched property data:", propertyData)
        
        // Initialize the form with the property data
        setEditMode(id, propertyData)
      } catch (error) {
        console.error("Error fetching property:", error)
        setPropertyError(error.message || "Failed to load property data. Please try again.")
      } finally {
        setIsFetchingProperty(false)
      }
    }
    
    fetchProperty()
  }, [id, isAuthenticated, setEditMode, resetForm])
  
  // Show loading state - Updated to match AdminListings spinner style
  if (isLoading || isFetchingProperty) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-red)] mx-auto mb-4"></div>
          <p className="text-lg">Loading property data...</p>
        </div>
      </div>
    )
  }
  
  // Show error message if there's an error
  if (propertyError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Error Loading Property</h2>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {propertyError}
          </div>
          <button 
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-[var(--primary-red)] text-white rounded-lg hover:bg-[var(--primary-red-hover)] transition-colors"
          >
            Back to Listings
          </button>
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