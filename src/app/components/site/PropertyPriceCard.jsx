'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from "next/link"
import Image from "next/image"
import { MessageCircle, MapPin, Users, Home, Calendar, XCircle } from "lucide-react"
import useAuthStore from '@/app/stores/authStore'
import { useRouter } from 'next/navigation'
import AvailabilityCalendar from './AvailabilityCalendar'
import { 
  format, 
  parseISO, 
  differenceInDays, 
  isValid, 
  isBefore,
  isSameDay,
  isWithinInterval, 
  startOfDay,
  addDays
} from 'date-fns'

// Function to format the price with commas
const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Calculate price for the next 5 available consecutive nights
const calculateDefaultPrice = (property) => {
  if (!property?.availability || property.availability.length === 0) {
    return { totalPrice: 0, nights: 5, perNight: 0 }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Sort availability by start date
  const sortedAvailability = [...property.availability]
    .filter(range => range.is_available)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))

  // Find availability ranges that are in the future
  const futureAvailability = sortedAvailability.filter(range => {
    const endDate = new Date(range.end_date)
    return endDate >= today
  })

  if (futureAvailability.length === 0) {
    return { totalPrice: 0, nights: 5, perNight: 0 }
  }

  // Calculate the price for the next 5 available days
  let totalPrice = 0
  let remainingNights = 5
  let nightsCalculated = 0
  let currentDate = null

  for (const range of futureAvailability) {
    if (remainingNights <= 0) break

    const startDate = new Date(range.start_date)
    const endDate = new Date(range.end_date)
    
    // Adjust start date if it's in the past
    const effectiveStartDate = startDate < today ? today : startDate
    
    // If this is the first range or if there's a gap in dates
    if (currentDate === null) {
      currentDate = new Date(effectiveStartDate)
    } else {
      // Check if this range is consecutive with the previous date
      const expectedDate = new Date(currentDate)
      expectedDate.setDate(expectedDate.getDate() + 1)
      
      // If there's a gap, start fresh from this range
      if (effectiveStartDate > expectedDate) {
        currentDate = new Date(effectiveStartDate)
      }
    }
    
    // Calculate how many nights we can use from this range
    while (currentDate <= endDate && remainingNights > 0) {
      totalPrice += range.price
      remainingNights--
      nightsCalculated++
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  return { 
    totalPrice, 
    nights: nightsCalculated, 
    perNight: nightsCalculated > 0 ? Math.round(totalPrice / nightsCalculated) : 0
  }
}

// Find the night rate for display purposes
const getBaseNightRate = (property) => {
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

export default function UpdatedPropertyPriceCard({ property, id }) {
  const { isAuthenticated, user } = useAuthStore()
  const [error, setError] = useState('')
  const router = useRouter()
  
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false)
  // Date selection state
  const [checkInDate, setCheckInDate] = useState(null)
  const [checkOutDate, setCheckOutDate] = useState(null)
  
  // Get base night rate for display
  const baseRateInfo = useMemo(() => {
    return getBaseNightRate(property)
  }, [property])
  
  // Calculate default 5-night price when no dates are selected
  const defaultPriceInfo = useMemo(() => {
    return calculateDefaultPrice(property)
  }, [property])
  
  // Calculate stay details based on selected dates
  const stayDetails = useMemo(() => {
    if (!checkInDate || !checkOutDate || !property?.availability) {
      // Return default 5-night price when no dates are selected
      return {
        isDefault: true,
        ...defaultPriceInfo,
        isValid: true
      }
    }
    
    // Get all days in the range (excluding checkout date)
    const nights = differenceInDays(checkOutDate, checkInDate)
    if (nights <= 0) return {
      isDefault: false,
      isValid: false,
      errorMessage: "Check-out date must be after check-in date",
      nights: 0
    }
    
    // Minimum stay validation
    if (property.minimum_stay && nights < property.minimum_stay) {
      return {
        isDefault: false,
        isValid: false,
        errorMessage: `Minimum stay is ${property.minimum_stay} nights`,
        nights
      }
    }
    
    let totalPrice = 0
    let datesValid = true
    
    // Calculate total price by checking each day's price from the availability
    let currentDate = startOfDay(checkInDate)
    const lastNight = startOfDay(addDays(checkOutDate, -1)) // Last night is the day before checkout
    
    while (isBefore(currentDate, checkOutDate) || isSameDay(currentDate, lastNight)) {
      let dayPrice = null
      let dayAvailable = false
      
      // Find which availability range this date falls into
      for (const range of property.availability) {
        const rangeStart = startOfDay(parseISO(range.start_date))
        const rangeEnd = startOfDay(parseISO(range.end_date))
        
        if (
          isWithinInterval(currentDate, { start: rangeStart, end: rangeEnd }) &&
          range.is_available
        ) {
          dayPrice = range.price
          dayAvailable = true
          break
        }
      }
      
      if (!dayAvailable) {
        datesValid = false
        break
      }
      
      totalPrice += dayPrice || 0
      currentDate = addDays(currentDate, 1)
    }
    
    return {
      isDefault: false,
      isValid: datesValid,
      nights,
      totalPrice: datesValid ? totalPrice : 0,
      perNight: datesValid && nights > 0 ? Math.round(totalPrice / nights) : 0
    }
  }, [checkInDate, checkOutDate, property, defaultPriceInfo])
  
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
  
  // Handle date selection in the calendar
  const handleDateSelect = (type, date) => {
    if (type === 'check-in') {
      setCheckInDate(date)
      // If check-out date is already set and is before the new check-in date, reset it
      if (checkOutDate && isBefore(checkOutDate, date)) {
        setCheckOutDate(null)
      }
    } else if (type === 'check-out') {
      setCheckOutDate(date)
    } else if (type === 'reset') {
      setCheckInDate(null)
      setCheckOutDate(null)
    }
  }
  
  // Format a date for display
  const formatDate = (date) => {
    if (!date) return ''
    return format(date, 'MM/dd/yyyy')
  }
  
  // Clear dates
  const clearDates = () => {
    setCheckInDate(null)
    setCheckOutDate(null)
  }
  
  // Get the current price to display (either from selection or default)
  const displayPrice = useMemo(() => {
    const currency = baseRateInfo.currency || 'USD'
    
    // If we have valid selected dates with a calculated price
    if (stayDetails && !stayDetails.isDefault && stayDetails.isValid && stayDetails.nights > 0) {
      return {
        price: stayDetails.perNight,
        priceDescription: 'night',
        currency
      }
    }
    
    // Show the average price from the default 5-night calculation
    // (instead of the base rate from just the first night)
    if (defaultPriceInfo.nights > 0) {
      return {
        price: defaultPriceInfo.perNight,
        priceDescription: 'night',
        currency
      }
    }
    
    // Fall back to the base rate if nothing else is available
    return baseRateInfo
  }, [stayDetails, defaultPriceInfo, baseRateInfo])

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
        <div className="mb-6">
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">
              {displayPrice.currency === 'USD' ? '$' : displayPrice.currency === 'EUR' ? '€' : displayPrice.currency === 'GBP' ? '£' : '$'}
              {formatPrice(displayPrice.price)}
            </span>
            <span className="text-gray-600 ml-2"> / {displayPrice.priceDescription || 'night'}</span>
          </div>
          
          {/* Date Picker Controls */}
          <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden">
            {/* Check-in / Check-out Inputs */}
            <div className="grid grid-cols-2 divide-x divide-gray-300">
              <div 
                className="p-3 cursor-pointer hover:bg-gray-50" 
                onClick={() => setShowCalendar(true)}
              >
                <div className="text-xs font-semibold text-gray-700 mb-1">CHECK-IN</div>
                <div className="text-sm">
                  {checkInDate ? formatDate(checkInDate) : 'Select date'}
                </div>
              </div>
              <div 
                className="p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setShowCalendar(true)}
              >
                <div className="text-xs font-semibold text-gray-700 mb-1">CHECKOUT</div>
                <div className="text-sm">
                  {checkOutDate ? formatDate(checkOutDate) : 'Select date'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Clear dates button, shown only when dates are selected */}
          {(checkInDate || checkOutDate) && (
            <div className="mt-2 flex justify-end">
              <button 
                onClick={clearDates}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <XCircle size={14} className="mr-1" />
                Clear dates
              </button>
            </div>
          )}
          
          {/* Stay pricing information */}
          {stayDetails && (
            <div className="mt-4">
              {!stayDetails.isValid ? (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  {stayDetails.errorMessage || "Selected dates are not available for booking."}
                </div>
              ) : (
                <div className="bg-green-50 p-3 rounded-md">
                  {stayDetails.isDefault ? (
                    // Default 5-night calculation
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-gray-700">
                        5-night stay estimate
                      </div>
                      <div className="text-sm text-gray-700">
                        ${formatPrice(stayDetails.totalPrice)}
                      </div>
                    </div>
                  ) : (
                    // Selected date range calculation
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-gray-700">
                        {stayDetails.nights > 10 ? (
                          // Show average per night for longer stays
                          `${stayDetails.nights} nights (avg. $${formatPrice(stayDetails.perNight)}/night)`
                        ) : (
                          `$${formatPrice(stayDetails.perNight)} x ${stayDetails.nights} nights`
                        )}
                      </div>
                      <div className="text-sm text-gray-700">
                        ${formatPrice(stayDetails.totalPrice)}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold pt-2 border-t border-green-100">
                    <div>{stayDetails.isDefault ? "5-Night Total" : "Est. Cost"}</div>
                    <div>${formatPrice(stayDetails.totalPrice)}</div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* View Availability Calendar Button */}
          <button 
            type="button"
            onClick={() => setShowCalendar(true)}
            className="w-full mt-4 border border-[#FF0056] bg-white text-[#FF0056] hover:bg-[#FFE5EC] py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <Calendar size={18} className="mr-2" />
            View Availability Calendar
          </button>
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
      
      {/* Availability Calendar Modal */}
      <AvailabilityCalendar 
        property={property} 
        isOpen={showCalendar} 
        onClose={() => setShowCalendar(false)} 
        onDateSelect={handleDateSelect}
        selectedCheckIn={checkInDate}
        selectedCheckOut={checkOutDate}
      />
    </>
  )
}