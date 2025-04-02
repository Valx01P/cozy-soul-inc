'use client';

import { useState, useCallback } from 'react';

export function useMultiStepForm(steps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Get the total number of steps
  const totalSteps = steps.length;
  
  // Get the current step
  const currentStep = steps[currentStepIndex];
  
  // Check if we're on the first step
  const isFirstStep = currentStepIndex === 0;
  
  // Check if we're on the last step
  const isLastStep = currentStepIndex === totalSteps - 1;
  
  // Move to the next step
  const goToNextStep = useCallback(() => {
    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [isLastStep]);
  
  // Move to the previous step
  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [isFirstStep]);
  
  // Go to a specific step by index
  const goToStep = useCallback((index) => {
    if (index >= 0 && index < totalSteps) {
      setCurrentStepIndex(index);
    }
  }, [totalSteps]);
  
  // Update form data
  const updateFormData = useCallback((newData) => {
    setFormData(prev => ({
      ...prev,
      ...newData
    }));
  }, []);
  
  // Handle form input changes
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear any error for the field being changed
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  }, [formErrors]);
  
  // Handle form submission
  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault();
      
      // Validate the current step
      if (currentStep.validate) {
        const errors = currentStep.validate(formData);
        
        if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          return;
        }
      }
      
      // If it's the last step, run the onSubmit callback
      if (isLastStep) {
        try {
          await onSubmit(formData);
          setIsCompleted(true);
        } catch (error) {
          console.error('Form submission error:', error);
        }
      } else {
        // Otherwise, move to the next step
        goToNextStep();
      }
    };
  }, [currentStep, formData, isLastStep, goToNextStep]);
  
  // Reset the form
  const resetForm = useCallback(() => {
    setCurrentStepIndex(0);
    setFormData({});
    setFormErrors({});
    setIsCompleted(false);
  }, []);
  
  return {
    currentStepIndex,
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    isCompleted,
    formData,
    formErrors,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    updateFormData,
    handleChange,
    handleSubmit,
    resetForm
  };
}