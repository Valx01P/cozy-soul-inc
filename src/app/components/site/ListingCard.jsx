'use client'
import Image from "next/image"
import Link from "next/link"
import { Home, Users, Bed, MapPin, Bath } from "lucide-react"
import { useEffect, useState } from "react"

export default function ListingCard({ listing }) {
  const [priceInfo, setPriceInfo] = useState({ price: 0, nights: 5 })
  
  useEffect(() => {
    if (listing?.availability?.length > 0) {
      calculatePriceForFiveNights()
    }
  }, [listing])

  // Calculate price for the next 5 available days
  const calculatePriceForFiveNights = () => {
    if (!listing.availability || listing.availability.length === 0) {
      setPriceInfo({ price: 0, nights: 5 })
      return
    }

    // Sort availability by start date
    const sortedAvailability = [...listing.availability]
      .filter(range => range.is_available)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))

    // Find availability ranges that are in the future
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const futureAvailability = sortedAvailability.filter(range => {
      const endDate = new Date(range.end_date)
      return endDate >= today
    })

    if (futureAvailability.length === 0) {
      setPriceInfo({ price: 0, nights: 5 })
      return
    }

    // Calculate the price for the next 5 available days
    let totalPrice = 0
    let remainingNights = 5
    let nightsCalculated = 0

    for (const range of futureAvailability) {
      if (remainingNights <= 0) break

      const startDate = new Date(range.start_date)
      const endDate = new Date(range.end_date)
      
      // Adjust start date if it's in the past
      const effectiveStartDate = startDate < today ? today : startDate
      
      // Calculate number of nights in this range
      const daysInRange = Math.floor((endDate - effectiveStartDate) / (1000 * 60 * 60 * 24)) + 1
      const nightsToUse = Math.min(daysInRange, remainingNights)
      
      // Add to total price
      totalPrice += range.price * nightsToUse
      remainingNights -= nightsToUse
      nightsCalculated += nightsToUse
    }

    // If we couldn't find 5 nights, use what we found
    setPriceInfo({ 
      price: totalPrice,
      nights: nightsCalculated
    })
  }

  if (!listing) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4">
        <p className="text-red-500">Error: Missing listing data</p>
      </div>
    )
  }

  // Format location string
  const location = listing.location?.city && listing.location?.state 
    ? `${listing.location.city}, ${listing.location.state}`
    : listing.location?.address || "Beautiful Location"

  // Format price display
  const formatPrice = () => {
    const currency = "USD"
    const currencySymbol = "$"
    
    return `${currencySymbol}${priceInfo.price.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }

  // Extract amenities to display (up to 3)
  const getAmenityList = () => {
    const amenityList = []
    
    if (listing.amenities) {
      // Loop through all amenity categories
      Object.entries(listing.amenities).forEach(([category, amenities]) => {
        if (Array.isArray(amenities)) {
          // If amenities is an array of objects with name property
          amenities.forEach(amenity => {
            if (amenity && amenity.name) {
              amenityList.push(amenity.name)
            }
          })
        }
      })
    }
    
    return amenityList.slice(0, 3) // Return just the first 3
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-shadow duration-300 group h-full">
      <Link href={`/listings/${listing.id}`} className="block h-full">
        <div className="flex flex-col h-full">
          {/* Images Container */}
          <div className="relative flex h-56 md:h-64">
            {/* Main Image */}
            <div className="w-2/3 h-full relative">
              <Image 
                src={listing.main_image || "https://placehold.co/1024x1024/png?text=Main+Image"} 
                alt={listing.title}
                className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-200" 
                width={600} 
                height={400}
              />
            </div>
            
            {/* Side Images */}
            <div className="w-1/3 h-full flex flex-col">
              <div className="h-1/2 relative">
                <Image 
                  src={listing.side_image1 || listing.extra_images?.[0] || listing.main_image || "https://placehold.co/1024x1024/png?text=Side+Image+1"} 
                  alt="Property view" 
                  className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-200"
                  width={300} 
                  height={200}
                />
              </div>
              <div className="h-1/2 relative">
                <Image 
                  src={listing.side_image2 || listing.extra_images?.[1] || listing.main_image || "https://placehold.co/1024x1024/png?text=Side+Image+2"} 
                  alt="Property view" 
                  className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-200"
                  width={300} 
                  height={200}
                />
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 flex flex-col flex-grow">
            <div className="space-y-3 flex-grow">
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-500 transition-colors">
                {listing.title}
              </h3>
              
              {/* Location */}
              <div className="flex items-center text-gray-600 text-sm">
                <MapPin size={14} className="mr-1 flex-shrink-0" />
                <span>{location}</span>
              </div>
              
              {/* Features */}
              <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600">
                {listing.number_of_bedrooms > 0 && (
                  <div className="flex items-center">
                    <Home size={14} className="mr-1 flex-shrink-0" />
                    <span>{listing.number_of_bedrooms} bedroom{listing.number_of_bedrooms !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {listing.number_of_beds > 0 && (
                  <div className="flex items-center">
                    <Bed size={14} className="mr-1 flex-shrink-0" />
                    <span>{listing.number_of_beds} bed{listing.number_of_beds !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {listing.number_of_bathrooms > 0 && (
                  <div className="flex items-center">
                    <Bath size={14} className="mr-1 flex-shrink-0" />
                    <span>{listing.number_of_bathrooms} bath{listing.number_of_bathrooms !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {listing.number_of_guests > 0 && (
                  <div className="flex items-center">
                    <Users size={14} className="mr-1 flex-shrink-0" />
                    <span>Up to {listing.number_of_guests} guest{listing.number_of_guests !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              
              {/* Amenities */}
              {getAmenityList().length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {getAmenityList().map((amenity, index) => (
                    <span 
                      key={index} 
                      className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-md"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Description */}
              <p className="text-gray-600 text-sm line-clamp-2 mt-2">
                {listing.description}
              </p>
            </div>
            
            {/* Price and View Property Button */}
            <div className="flex justify-between items-center mt-4">
              <div>
                <span className="text-lg font-semibold text-gray-900">{formatPrice()}</span>
                <span className="text-gray-600 text-sm"> for {priceInfo.nights} night{priceInfo.nights !== 1 ? 's' : ''}</span>
              </div>
              <div className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                View Property
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}