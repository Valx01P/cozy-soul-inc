'use client'
import { useState, useEffect } from 'react'
import Link from "next/link"
import Image from "next/image"
import { MessageCircle, MapPin, Users, Home, X, Send } from "lucide-react"
import useAuthStore from '@/app/stores/authStore'
import useMessageStore from '@/app/stores/messageStore'
import { useRouter } from 'next/navigation'

// Function to format the price with commas
const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Find the next available date range with price
const getNextAvailablePricing = (property) => {
  if (!property?.availability || property.availability.length === 0) {
    return { price: 0, priceDescription: 'night' }
  }

  const today = new Date()
  const availableRanges = property.availability
    .filter(range => range.is_available && new Date(range.end_date) >= today)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))

  if (availableRanges.length === 0) {
    // Fall back to the first range even if not available
    const firstRange = property.availability[0]
    return { 
      price: firstRange.price || 0,
      priceDescription: 'night',
      currency: 'USD' // Default currency
    }
  }

  const nextRange = availableRanges[0]
  
  return {
    price: nextRange.price || 0,
    priceDescription: 'night',
    currency: 'USD' // Default currency
  }
}

// Calculate total price for 5 nights
const calculateTotalFor5Nights = (property) => {
  const { price } = getNextAvailablePricing(property)
  return price * 5
}

export default function PropertyPriceCard({ property, id }) {
  const { price, priceDescription, currency = 'USD' } = getNextAvailablePricing(property)
  const totalPrice = calculateTotalFor5Nights(property)
  const { isAuthenticated, user } = useAuthStore()
  const { startConversation, sendingMessage, 
          conversations, fetchConversations } = useMessageStore()
  const [showContactModal, setShowContactModal] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // On component mount, fetch conversations if authenticated
  useEffect(() => {
    if (isAuthenticated && conversations.length === 0) {
      fetchConversations(1, true);
    }
  }, [isAuthenticated, fetchConversations, conversations.length]);

  // Check if there's already a conversation for this property
  const checkExistingConversation = async () => {
    try {
      setIsLoading(true);
      
      // Ensure conversations are loaded
      if (conversations.length === 0) {
        await fetchConversations(1, true);
      }
      
      // Check if there's a conversation for this property
      const existingConversation = conversations.find(
        conv => conv.property && conv.property.id === Number(id)
      );
      
      setIsLoading(false);
      return existingConversation;
    } catch (err) {
      setIsLoading(false);
      console.error('Error checking existing conversations:', err);
      return null;
    }
  };

  // Handle contact host button click
  const handleContactClick = async () => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      router.push(`/login?redirect=/listings/${id}`);
      return;
    }
    
    // Don't allow messaging if the user is the host
    if (user?.id === property.host_id) {
      setError("You can't message yourself as the property owner.");
      setIsLoading(false);
      return;
    }
    
    try {
      // Check for existing conversation
      const existingConversation = await checkExistingConversation();
      
      if (existingConversation) {
        setSuccessMessage('You already have a conversation about this property.');
        // Open navbar message button after a short delay
        setTimeout(() => {
          document.getElementById('navbarMessageButton')?.click();
        }, 500);
        setIsLoading(false);
        return;
      }
      
      // Open contact modal if no existing conversation
      setShowContactModal(true);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to check existing conversations. Please try again.');
      setIsLoading(false);
    }
  }
  
  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    setError('');
    
    try {
      // Start a new conversation with this property's host
      await startConversation(id, message);
      
      // Close the modal and reset form
      setShowContactModal(false);
      setMessage('');
      setSuccessMessage('Message sent successfully!');
      
      // Open the chat in the navbar after a short delay
      setTimeout(() => {
        document.getElementById('navbarMessageButton')?.click();
      }, 500);
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    }
  }
  
  // Handle modal close
  const handleModalClose = () => {
    setShowContactModal(false);
    setError('');
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
        <div className="mb-6">
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">
              {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
              {formatPrice(price)}
            </span>
            <span className="text-gray-600 ml-2"> / {priceDescription || 'night'}</span>
          </div>
          <div className="mt-1 text-gray-500 text-sm">
            <span>${formatPrice(totalPrice)} total for 5 nights</span>
          </div>
        </div>
        
        {/* Success message */}
        {successMessage && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm">
            {successMessage}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}
        
        {/* Contact Host Button */}
        <button 
          type="button"
          onClick={handleContactClick}
          disabled={isLoading}
          className="w-full bg-[var(--primary-red)] hover:bg-[var(--primary-red-hover)] hover:cursor-pointer text-white py-3 px-4 rounded-lg font-medium mb-4 transition-colors flex items-center justify-center disabled:opacity-70"
        >
          {isLoading ? (
            <div className="mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <MessageCircle size={18} className="mr-2" />
          )}
          {isLoading ? 'Checking...' : 'Contact Host'}
        </button>
        
        {/* Property Highlights */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-medium text-gray-900 mb-3">Property highlights</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <MapPin size={16} className="text-[var(--primary-red)] mr-2 mt-1" />
              <span className="text-gray-700">Perfect location in {property.location?.city || 'the city'}</span>
            </li>
            <li className="flex items-start">
              <Users size={16} className="text-[var(--primary-red)] mr-2 mt-1" />
              <span className="text-gray-700">Ideal for groups of {property.number_of_guests} or less</span>
            </li>
            <li className="flex items-start">
              <Home size={16} className="text-[var(--primary-red)] mr-2 mt-1" />
              <span className="text-gray-700">{property.number_of_bedrooms} bedroom{property.number_of_bedrooms !== 1 ? 's' : ''} with {property.number_of_beds} bed{property.number_of_beds !== 1 ? 's' : ''}</span>
            </li>
          </ul>
        </div>
        
        {/* Host Info */}
        <div className="border-t border-gray-200 pt-4 mt-4">
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
              <h3 className="font-medium">
                Hosted by {property.host?.first_name} {property.host?.last_name}
              </h3>
              <p className="text-gray-600 text-sm">
                Host since {property.host?.host_since || '2023'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contact Host Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div 
            className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">Contact Host</h3>
              <button
                type="button"
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 overflow-hidden bg-[#FFE5EC] rounded-full mr-3 flex items-center justify-center">
                  {property.host?.profile_image ? (
                    <Image 
                      src={property.host.profile_image} 
                      alt={`Host ${property.host.first_name}`}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full" 
                    />
                  ) : (
                    <span className="text-[#FF0056] font-medium text-sm">
                      {property.host?.first_name?.charAt(0) || 'A'}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium">
                    {property.host?.first_name} {property.host?.last_name}
                  </h4>
                  <p className="text-gray-500 text-sm">Host of "{property.title}"</p>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSendMessage}>
                <div className="mb-4">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask the host about the property, availability, or anything else you'd like to know..."
                    className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:border-[var(--primary-red)] focus:ring-[var(--primary-red)] focus:ring-1 focus:outline-none"
                    disabled={sendingMessage}
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="mr-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none"
                    disabled={sendingMessage}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--primary-red)] hover:bg-[var(--primary-red-hover)] text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-red)]"
                    disabled={sendingMessage || !message.trim()}
                  >
                    {sendingMessage ? (
                      <>
                        <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} className="mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}