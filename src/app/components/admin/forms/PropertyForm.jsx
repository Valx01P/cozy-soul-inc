"use client"

import { useEffect } from 'react'
import { FormStepper } from './FormStepper'
import { BasicInfoFormStep } from './BasicInfoFormStep'
import { LocationFormStep } from './LocationFormStep'
import { DetailsFormStep } from './DetailsFormStep'
import { ConfirmSubmitStep } from './ConfirmSubmitStep'
import usePropertyFormStore from "../../../stores/propertyFormStore"

export function PropertyForm() {
  const { 
    currentStep, 
    setCurrentStep, 
    nextStep, 
    prevStep, 
    getFinalPropertyData, 
    resetForm 
  } = usePropertyFormStore(state => state)

  // Define steps
  const steps = [
    { label: "Basic Info", component: <BasicInfoFormStep /> },
    { label: "Location", component: <LocationFormStep /> },
    { label: "Details", component: <DetailsFormStep /> },
    { label: "Review", component: <ConfirmSubmitStep /> }
  ]

  // Reset form when component unmounts
  useEffect(() => {
    return () => {
      // Uncomment this if you want to reset the form state when the component unmounts
      // resetForm()
    }
  }, [resetForm])

  // Log the current amenities state whenever currentStep changes
  useEffect(() => {
    const state = usePropertyFormStore.getState();
    console.log(`Current step changed to: ${currentStep}`);
    console.log("Current amenities state:", state.amenities);
  }, [currentStep]);

  // Handle step validation
  const validateCurrentStep = () => {
    // In a real app, you would have more comprehensive validation logic
    // This is a basic validation to ensure required fields are filled

    const state = usePropertyFormStore.getState();
    
    // Log the current state for debugging
    console.log("Current form state during validation:", state);

    if (currentStep === 0) {
      // Basic Info validation
      if (!state.title || !state.description || !state.price) {
        alert("Please fill out all required fields in Basic Info section");
        return false;
      }
    } else if (currentStep === 1) {
      // Location validation
      if (!state.location.street || !state.location.city || !state.location.state || !state.location.zip) {
        alert("Please fill out all required fields in Location section");
        return false;
      }
    } else if (currentStep === 2) {
      // Details validation
      if (!state.number_of_guests || !state.number_of_bedrooms || !state.number_of_beds) {
        alert("Please fill out all required fields in Details section");
        return false;
      }
      
      // Log the amenities state specifically when validating the Details step
      console.log("Amenities state during validation:", state.amenities);
      
      // Ensure the amenities object persists in the store
      if (Object.keys(state.amenities || {}).length > 0) {
        // Force a refresh of the amenities state to ensure it sticks
        const amenitiesCopy = JSON.parse(JSON.stringify(state.amenities));
        usePropertyFormStore.setState({ 
          amenities: amenitiesCopy 
        });
        console.log("Refreshed amenities state:", amenitiesCopy);
      }
    }
    // No validation needed for the confirmation step
    
    return true;
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // If we're not on the last step, move to the next one
    if (currentStep < steps.length - 1) {
      if (validateCurrentStep()) {
        nextStep();
      }
      return;
    }
    
    // We're on the last step (confirmation), so submit the form
    try {
      // Generate the final property data
      const propertyData = getFinalPropertyData();
      console.log("Final property data:", propertyData);
      console.log("Final amenities data:", propertyData.Properties[0].amenities);
      
      // Show the full JSON data
      alert(JSON.stringify(propertyData, null, 2));
    } catch (error) {
      console.error("Error generating final property data:", error);
      alert("An error occurred while generating the final property data. Please check the console for more details.");
    }
  }

  // Handle navigating to a specific step
  const handleStepClick = (stepIndex) => {
    // First validate the current step before allowing to navigate
    if (stepIndex > currentStep) {
      if (!validateCurrentStep()) {
        return;
      }
    }
    
    // Only allow navigating to steps that the user has already been to
    // or the next step
    if (stepIndex <= currentStep + 1) {
      setCurrentStep(stepIndex);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">List Your Property</h1>
      <p className="text-gray-600 mb-8">
        Complete the form below to list your property on our platform.
      </p>
      
      {/* Progress Stepper */}
      <FormStepper 
        currentStep={currentStep} 
        steps={steps} 
        onStepClick={handleStepClick} 
      />
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-8 mt-4">
        <h2 className="text-xl font-bold mb-6">
          {steps[currentStep].label}
        </h2>
        
        {/* Current Step Content */}
        <div className="min-h-[400px]">
          {steps[currentStep].component}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg font-medium transition
              ${currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            Back
          </button>
          
          <button
            type="submit"
            className={`px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition
              ${currentStep === steps.length - 1
                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' 
                : 'bg-[var(--primary-red)] text-white hover:bg-[var(--primary-red-hover)] focus:ring-[var(--primary-red)]'
              }
            `}
          >
            {currentStep < steps.length - 1 ? 'Continue' : 'Submit Property'}
          </button>
        </div>
      </form>
    </div>
  )
}