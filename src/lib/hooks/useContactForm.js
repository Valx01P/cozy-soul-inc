'use client';

import { useState, useCallback } from 'react';

export function useContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    propertyId: null
  });
  
  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: null
  });
  
  // Handle form input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  // Set the property ID for the inquiry
  const setPropertyId = useCallback((id) => {
    setFormData(prev => ({
      ...prev,
      propertyId: id
    }));
  }, []);
  
  // Submit the contact form
  const submitForm = useCallback(async () => {
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({
        loading: false,
        success: false,
        error: 'Please fill out all required fields'
      });
      return false;
    }
    
    setStatus({
      loading: true,
      success: false,
      error: null
    });
    
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      setStatus({
        loading: false,
        success: true,
        error: null
      });
      
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        propertyId: formData.propertyId // Keep the property ID in case they want to send another message
      });
      
      return true;
    } catch (err) {
      setStatus({
        loading: false,
        success: false,
        error: err.message
      });
      console.error('Error submitting contact form:', err);
      return false;
    }
  }, [formData]);
  
  // Reset the form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
      propertyId: null
    });
    
    setStatus({
      loading: false,
      success: false,
      error: null
    });
  }, []);
  
  return {
    formData,
    status,
    handleChange,
    setPropertyId,
    submitForm,
    resetForm
  };
}