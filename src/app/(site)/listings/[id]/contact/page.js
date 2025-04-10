'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Send, MessageCircle } from 'lucide-react'
import { use } from 'react'
import Image from 'next/image'

export default function PropertyContactPage({ params }) {
  // Properly unwrap params using React.use()
  const resolvedParams = use(params)
  const { id } = resolvedParams
  
  const router = useRouter()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    propertyid: id // Include the property ID
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formStatus, setFormStatus] = useState(null)
  
  // Fetch property data
  useEffect(() => {
    async function fetchProperty() {
      try {
        setLoading(true)
        const response = await fetch(`/api/listings/${id}`)
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const data = await response.json()
        setProperty(data)
      } catch (err) {
        console.error("Error fetching property:", err)
        setError("Failed to load property details")
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchProperty()
    }
  }, [id])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Form validation
    if (!formData.name || !formData.email || !formData.message) {
      setFormStatus({
        success: false,
        message: 'Please fill out all required fields'
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setFormStatus({
          success: true,
          message: 'Message sent successfully! We will get back to you soon.'
        })
        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
          propertyid: id
        })
      } else {
        setFormStatus({
          success: false,
          message: data.message || 'Something went wrong. Please try again later.'
        })
      }
    } catch (error) {
      setFormStatus({
        success: false,
        message: 'Failed to send message. Please try again later.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleGoBack = () => {
    router.push(`/listings/${id}`)
  }
  
  // Format price with commas
  const formatPrice = (price) => {
    return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
        <button 
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center text-[var(--primary-red)] mb-8 hover:underline"
        >
          <ChevronLeft size={20} className="mr-1" />
          Back to listings
        </button>
        
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "This property doesn't exist or has been removed."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Navigation */}
      <button 
        type="button"
        onClick={handleGoBack}
        className="flex items-center text-[var(--primary-red)] mb-8 hover:underline"
      >
        <ChevronLeft size={20} className="mr-1" />
        Back to property
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Property Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">Contact Host</h1>
          
          <div className="flex items-start space-x-4 mb-6">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={property.main_image}
                alt={property.title}
                fill
                className="object-cover"
              />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold">{property.title}</h2>
              <p className="text-gray-600 mb-2">{property.location.city}, {property.location.state}</p>
              <p className="font-bold text-lg">
                {property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : property.currency === 'GBP' ? '£' : '$'}
                {formatPrice(property.price)}
                <span className="text-gray-500 font-normal text-base ml-1">/ {property.price_description || 'night'}</span>
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">Property Details</h3>
            
            <div className="grid grid-cols-2 gap-4 text-gray-600">
              <div>
                <p><span className="font-medium">Bedrooms:</span> {property.number_of_bedrooms}</p>
                <p><span className="font-medium">Bathrooms:</span> {property.number_of_bathrooms}</p>
              </div>
              <div>
                <p><span className="font-medium">Beds:</span> {property.number_of_beds}</p>
                <p><span className="font-medium">Guests:</span> {property.number_of_guests}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-2">About the Host</h3>
            <div className="flex items-center">
              <div className="w-12 h-12 overflow-hidden bg-[#FFE5EC] rounded-full mr-4 flex items-center justify-center">
                {property.host?.profile_image ? (
                  <Image 
                    src={property.host.profile_image} 
                    alt={`Host ${property.host.first_name}`}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full" 
                  />
                ) : (
                  <span className="text-[#FF0056] font-medium text-lg">
                    {property.host?.first_name?.charAt(0) || 'A'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">
                  Hosted by {property.host?.first_name} {property.host?.last_name}
                </p>
                <p className="text-gray-600 text-sm">
                  Host since {property.host?.host_since || '2023'} • Response time: Within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contact Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Send a Message</h2>
          
          {formStatus && (
            <div className={`mb-6 p-4 rounded-lg ${formStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {formStatus.message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-[var(--primary-red)]">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-[var(--primary-red)]">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Your Message <span className="text-[var(--primary-red)]">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="I'm interested in booking this property..."
                rows="5"
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--primary-red)] hover:bg-[var(--primary-red-hover)] text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle size={18} className="mr-2" />
                  Contact Host
                </>
              )}
            </button>
            
            <p className="text-gray-500 text-sm mt-4 text-center">
              By contacting the host, you agree to our terms and privacy policy. We'll never share your personal information.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}