// my-app/src/app/components/admin/forms/PropertyForm.jsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { FormStepper } from './FormStepper'
import { BasicInfoFormStep } from './BasicInfoFormStep'
import { LocationFormStep } from './LocationFormStep'
import { DetailsFormStep } from './DetailsFormStep'
import { PricingFormStep } from './PricingFormStep'
import { ConfirmSubmitStep } from './ConfirmSubmitStep'
import usePropertyFormStore from '@/app/stores/propertyFormStore'

export default function PropertyForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { 
    mode,
    propertyId,
    currentStep, 
    setCurrentStep, 
    nextStep, 
    prevStep,
    priceRanges,
    submitProperty,
    submitError,
    setSubmitError,
    resetForm 
  } = usePropertyFormStore(state => state)

  // Define steps
  const steps = [
    { label: "Basic Info", component: <BasicInfoFormStep /> },
    { label: "Location", component: <LocationFormStep /> },
    { label: "Details", component: <DetailsFormStep /> },
    { label: "Pricing", component: <PricingFormStep /> },
    { label: "Review", component: <ConfirmSubmitStep /> }
  ]

  // Optionally reset when unmounting
  useEffect(() => {
    return () => {
      // resetForm()
    }
  }, [resetForm])

  // Log for debugging
  useEffect(() => {
    console.log(`Current step changed to: ${currentStep}`)
    console.log("Current amenities state:", usePropertyFormStore.getState().amenities)
  }, [currentStep])

  // Basic step validation
  const validateCurrentStep = () => {
    const state = usePropertyFormStore.getState()
    console.log("Validating step", currentStep, state)

    if (currentStep === 0) {
      if (!state.title || !state.description) {
        toast.error("Please fill out all required fields in Basic Info section")
        return false
      }
      if (!state.main_image_url && !state.main_image) {
        toast.error("Please upload at least a main image for your property")
        return false
      }
    } else if (currentStep === 1) {
      if (!state.location.street || !state.location.city || !state.location.state || !state.location.zip) {
        toast.error("Please fill out all required fields in Location section")
        return false
      }
    } else if (currentStep === 2) {
      if (!state.number_of_guests || !state.number_of_bedrooms || !state.number_of_beds) {
        toast.error("Please fill out all required fields in Details section")
        return false
      }
      console.log("Amenities during validation:", state.amenities)
      if (Object.keys(state.amenities || {}).length > 0) {
        const amenitiesCopy = JSON.parse(JSON.stringify(state.amenities))
        usePropertyFormStore.setState({ amenities: amenitiesCopy })
        console.log("Refreshed amenities state:", amenitiesCopy)
      }
    } else if (currentStep === 3) {
      if (state.priceRanges.length === 0) {
        toast.error("Please add at least one price range for your property")
        return false
      }
    }
    return true
  }

  // Handle form submission & final step
  const handleSubmit = async (e) => {
    e.preventDefault()

    // If not on last step, just advance
    if (currentStep < steps.length - 1) {
      if (validateCurrentStep()) nextStep()
      return
    }

    // Last step: actually submit
    try {
      setIsSubmitting(true)
      setSubmitError(null)

      // submitProperty() throws on failure
      await submitProperty()

      toast.success(
        mode === 'edit' 
          ? 'Property updated successfully!' 
          : 'Property created successfully!'
      )

      // Redirect after a short delay
      setTimeout(() => router.push('/admin'), 1500)

    } catch (error) {
      console.error("Error submitting property:", error)
      toast.error(error.message || "Failed to submit property. Please try again.")
      setSubmitError(error.message || "Failed to submit property")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Navigation via stepper
  const handleStepClick = (stepIndex) => {
    if (stepIndex > currentStep && !validateCurrentStep()) return
    if (stepIndex <= currentStep + 1) {
      setCurrentStep(stepIndex)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">
        {mode === 'edit' ? 'Edit Your Property' : 'List Your Property'}
      </h1>
      <p className="text-gray-600 mb-8">
        {mode === 'edit' 
          ? 'Update your property listing information below.' 
          : 'Complete the form below to list your property on our platform.'}
      </p>
      
      {/* Progress Stepper */}
      <FormStepper 
        currentStep={currentStep} 
        steps={steps} 
        onStepClick={handleStepClick} 
      />
      
      {/* Multi-step Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-8 mt-4">
        <h2 className="text-xl font-bold mb-6">{steps[currentStep].label}</h2>
        
        <div className="min-h-[400px]">
          {steps[currentStep].component}
        </div>
        
        {submitError && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            <p className="font-medium">Error:</p>
            <p>{submitError}</p>
          </div>
        )}
        
        <div className="flex justify-between pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0 || isSubmitting}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              (currentStep === 0 || isSubmitting)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${
              currentStep === steps.length - 1
                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                : 'bg-[var(--primary-red)] text-white hover:bg-[var(--primary-red-hover)] focus:ring-[var(--primary-red)]'
            } ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 
                       7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {currentStep < steps.length - 1 ? 'Processing...' : 'Submitting...'}
              </span>
            ) : (
              currentStep < steps.length - 1 ? 'Continue' : 'Submit Property'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
