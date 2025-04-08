'use client'
import { useState } from 'react'
import { MapPin, Mail, Phone, Send } from 'lucide-react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formStatus, setFormStatus] = useState(null)
  
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
          message: ''
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Have questions about our properties or services? Feel free to get in touch with us and we'll get back to you as soon as possible.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-[var(--primary-red)] p-3 rounded-full text-white mr-4">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Our Location</h3>
                <p className="text-gray-600 mt-1">123 Main Street, Miami, FL 33101</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-[var(--primary-red)] p-3 rounded-full text-white mr-4">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Email Us</h3>
                <p className="text-gray-600 mt-1">info@cozysoul.com</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-[var(--primary-red)] p-3 rounded-full text-white mr-4">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Call Us</h3>
                <p className="text-gray-600 mt-1">(305) 555-1234</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10">
            <h3 className="text-lg font-medium mb-4">Office Hours</h3>
            <div className="space-y-2 text-gray-600">
              <p className="flex justify-between">
                <span>Monday - Friday:</span>
                <span>9:00 AM - 6:00 PM</span>
              </p>
              <p className="flex justify-between">
                <span>Saturday:</span>
                <span>10:00 AM - 4:00 PM</span>
              </p>
              <p className="flex justify-between">
                <span>Sunday:</span>
                <span>Closed</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Contact Form */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
          
          {formStatus && (
            <div className={`mb-6 p-4 rounded-lg ${formStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {formStatus.message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Send size={18} className="mr-2" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}