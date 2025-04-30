'use client'
import Image from "next/image"
import Link from "next/link"
import { Home, Users, Bed, MapPin, Bath } from "lucide-react"
import { useListings } from "@/app/stores/listingStore"

export default function ListingCard({ listing }) {
  // Get price info from the global store instead of calculating locally
  const { getListingPriceInfo } = useListings()
  const priceInfo = getListingPriceInfo(listing?.id)
  
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
    return priceInfo.formattedPrice || `$${priceInfo.price.toLocaleString(undefined, {
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