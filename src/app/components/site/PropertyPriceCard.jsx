'use client'
import { useState } from 'react'
import Link from "next/link"
import Image from "next/image"
import { MessageCircle, MapPin, Users, Home } from "lucide-react"
import useAuthStore from '@/app/stores/authStore'
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
  const [error, setError] = useState('')
  const router = useRouter()

  // Handle contact host button click
  const handleContactClick = () => {
    setError('');
    
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      router.push(`/login?redirect=/listings/${id}/contact`);
      return;
    }
    
    // Don't allow contacting if the user is the host
    if (user?.id === property.host_id) {
      setError("You can't contact yourself as the property owner.");
      return;
    }
    
    // Redirect to contact page
    router.push(`/listings/${id}/contact`);
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
          className="w-full bg-[var(--primary-red)] hover:bg-[var(--primary-red-hover)] hover:cursor-pointer text-white py-3 px-4 rounded-lg font-medium mb-4 transition-colors flex items-center justify-center"
        >
          <MessageCircle size={18} className="mr-2" />
          Contact Host
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
    </>
  )
}