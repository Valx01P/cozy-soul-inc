'use client';
import { useState, useEffect } from 'react';
import useAuthStore from "../../stores/authStore";
import Image from 'next/image';
import { Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isLoading, error, clearError } = useAuthStore();
  
  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      if (error) clearError();
    };
  }, [error, clearError]);
  
  // Show toast if there's an error from the auth store
  useEffect(() => {
    if (error) {
      showToast(error, 'error');
      setIsSubmitting(false); // Reset submitting state when there's an error
    }
  }, [error]);
  
  // Reset submitting state when loading is complete
  useEffect(() => {
    if (!isLoading && isSubmitting) {
      setIsSubmitting(false);
    }
  }, [isLoading]);
  
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error specific to this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear global error
    if (error) clearError();
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Set local submitting state to true
    setIsSubmitting(true);
    
    try {
      // Call login action from auth store
      await login(formData.email, formData.password);
      // Show success toast
      showToast('Login successful! Redirecting...', 'success');
    } catch (err) {
      // Error is already handled by the auth store and will be shown as a toast
      console.error('Login error:', err);
      setIsSubmitting(false);
    }
  };

  // Determine loading state based on both store loading state and local submitting state
  const showLoadingState = isLoading && isSubmitting;

  return (
    <>
      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center px-4 py-3 rounded-lg shadow-md ${
          toast.type === 'success' ? 'bg-green-100 text-green-800' : 
          toast.type === 'error' ? 'bg-red-100 text-red-800' : 
          'bg-blue-100 text-blue-800'
        }`}>
          <div className="flex-shrink-0 mr-2">
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
          </div>
          <p>{toast.message}</p>
          <button 
            onClick={() => setToast({ show: false, message: '', type: '' })}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>
      )}
    
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div className="text-center">
            <div className="flex justify-center">
              <Image src="/svg/red-logo.svg" alt="Logo" width={60} height={60} className="transition-transform duration-300 hover:scale-110" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Admin Portal
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to manage your properties
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  {/* Icon wrapper with high z-index */}
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  {/* Input with position relative to create stacking context */}
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`appearance-none w-full pl-10 pr-3 py-3 border ${
                      validationErrors.email ? 'border-red-300 ring-1 ring-red-500' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#FF0056] focus:border-[#FF0056] focus:z-10 sm:text-sm relative`}
                    placeholder="admin@example.com"
                    style={{ backgroundColor: 'transparent' }}
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  {/* Lock icon wrapper with high z-index */}
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  {/* Input with position relative to create stacking context */}
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`appearance-none w-full pl-10 pr-10 py-3 border ${
                      validationErrors.password ? 'border-red-300 ring-1 ring-red-500' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#FF0056] focus:border-[#FF0056] focus:z-10 sm:text-sm relative`}
                    placeholder="••••••••"
                    style={{ backgroundColor: 'transparent' }}
                  />
                  {/* Eye icon button with higher z-index */}
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={showLoadingState}
                className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#FF0056] hover:bg-[#D80048] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF0056] transition-colors ${showLoadingState ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {showLoadingState ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
          
          <div className="text-center text-sm text-gray-500 mt-6">
            <p>This is a secure area. Unauthorized access is prohibited.</p>
            <div className="mt-2 flex justify-center">
              <Link href="/" className="text-[#FF0056] hover:text-[#D80048] transition-colors">
                Back to main site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}