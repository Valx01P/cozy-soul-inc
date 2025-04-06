import Image from "next/image"
import Link from "next/link"
import { Home, Users, Bed, MapPin } from "lucide-react"

export default function ListingCard({ property }) {
  if (!property) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4">
        <p className="text-red-500">Error: Missing property data</p>
      </div>
    )
  }

  // Format location string
  const location = property.location?.city && property.location?.state 
    ? `${property.location.city}, ${property.location.state}`
    : property.location?.address || "Beautiful Location"

  // Format price display
  const formatPrice = () => {
    const price = property.price
    const currency = property.currency || "USD"
    const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"
    
    return `${currencySymbol}${price}`
  }

  // Extract amenities to display (up to 3)
  const getAmenityList = () => {
    const amenityList = []
    
    if (property.amenities) {
      // Loop through all amenity categories
      Object.entries(property.amenities).forEach(([category, amenities]) => {
        // Loop through amenities in this category
        Object.entries(amenities).forEach(([name, available]) => {
          if (available === true) {
            amenityList.push(name)
          }
        })
      })
    }
    
    return amenityList.slice(0, 3) // Return just the first 3
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group h-full">
      <Link href={`/property/${property.id}`} className="block h-full">
        <div className="flex flex-col h-full">
          {/* Images Container */}
          <div className="relative flex h-56 md:h-64">
            {/* Main Image */}
            <div className="w-2/3 h-full relative">
              <Image 
                src={property.main_image} 
                alt={property.title}
                className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-500" 
                width={600} 
                height={400}
              />
            </div>
            
            {/* Side Images */}
            <div className="w-1/3 h-full flex flex-col">
              <div className="h-1/2 relative">
                <Image 
                  src={property.side_image1 || property.extra_images?.[0] || property.main_image} 
                  alt="Property view" 
                  className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-500"
                  width={300} 
                  height={200}
                />
              </div>
              <div className="h-1/2 relative">
                <Image 
                  src={property.side_image2 || property.extra_images?.[1] || property.main_image} 
                  alt="Property view" 
                  className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-500"
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
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[var(--primary-red)] transition-colors">
                {property.title}
              </h3>
              
              {/* Location */}
              <div className="flex items-center text-gray-600 text-sm">
                <MapPin size={14} className="mr-1 flex-shrink-0" />
                <span>{location}</span>
              </div>
              
              {/* Features */}
              <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600">
                {property.number_of_bedrooms > 0 && (
                  <div className="flex items-center">
                    <Home size={14} className="mr-1 flex-shrink-0" />
                    <span>{property.number_of_bedrooms} bedroom{property.number_of_bedrooms !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {property.number_of_beds > 0 && (
                  <div className="flex items-center">
                    <Bed size={14} className="mr-1 flex-shrink-0" />
                    <span>{property.number_of_beds} bed{property.number_of_beds !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {property.number_of_guests > 0 && (
                  <div className="flex items-center">
                    <Users size={14} className="mr-1 flex-shrink-0" />
                    <span>Up to {property.number_of_guests} guest{property.number_of_guests !== 1 ? 's' : ''}</span>
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
                {property.description}
              </p>
            </div>
            
            {/* Price and View Property Button */}
            <div className="flex justify-between items-center mt-4">
              <div>
                <span className="text-lg font-semibold text-gray-900">{formatPrice()}</span>
                <span className="text-gray-600 text-sm"> / {property.price_description}</span>
              </div>
              <div className="bg-[var(--primary-red)] hover:bg-[var(--primary-red-hover)] text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                View Property
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}