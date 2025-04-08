'use client'
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, Home, Users, Bed, Bath, Star, MapPin, Share, Heart } from "lucide-react"

export default function PropertyDetail({ params }) {
  const router = useRouter()
  const { id } = params
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImage, setActiveImage] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    async function fetchProperty() {
      try {
        setLoading(true)
        const response = await fetch(`http://localhost:3000/api/listings/${id}`)
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const data = await response.json()
        setProperty(data)
        setActiveImage(data.main_image)
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

  const handleGoBack = () => {
    router.back()
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        text: property?.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          alert("Link copied to clipboard!")
        })
        .catch(err => {
          console.error("Could not copy link: ", err)
        })
    }
  }

  // Format amenities by category
  const formatAmenities = () => {
    if (!property?.amenities) return []
    
    return Object.entries(property.amenities).map(([category, items]) => ({
      category,
      items: Array.isArray(items) ? items : []
    }))
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
        <Link 
          href="/"
          className="flex items-center text-[var(--primary-red)] mb-8 hover:underline"
        >
          <ChevronLeft size={20} className="mr-1" />
          Back to listings
        </Link>
        
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "This property doesn't exist or has been removed."}</p>
          <Link
            href="/"
            className="inline-block bg-[var(--primary-red)] hover:bg-[var(--primary-red-hover)] text-white px-6 py-3 rounded-full text-sm font-medium transition-colors"
          >
            Return to Listings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
      {/* Navigation */}
      <Link 
        href="/"
        className="flex items-center text-[var(--primary-red)] mb-4 md:mb-8 hover:underline"
      >
        <ChevronLeft size={20} className="mr-1" />
        Back to listings
      </Link>
      
      {/* Property Title Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{property.title}</h1>
          <div className="flex items-center mt-2 text-gray-600">
            <MapPin size={16} className="mr-1" />
            <span>{`${property.location.city || ''}, ${property.location.state || ''}, ${property.location.country || ''}`}</span>
          </div>
        </div>
        
        <div className="flex space-x-4 mt-4 md:mt-0">
          <button 
            type="button"
            onClick={handleShare}
            className="flex items-center text-gray-700 hover:text-[var(--primary-red)]"
          >
            <Share size={20} className="mr-2" />
            <span className="hidden md:inline">Share</span>
          </button>
          
          <button 
            type="button"
            onClick={toggleFavorite}
            className={`flex items-center ${isFavorite ? 'text-[var(--primary-red)]' : 'text-gray-700 hover:text-[var(--primary-red)]'}`}
          >
            <Heart size={20} className="mr-2" fill={isFavorite ? 'currentColor' : 'none'} />
            <span className="hidden md:inline">Save</span>
          </button>
        </div>
      </div>
      
      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 mb-8">
        <div className="md:col-span-2 row-span-2 relative rounded-tl-xl md:rounded-l-xl overflow-hidden h-64 md:h-auto">
          <Image
            src={activeImage || property.main_image}
            alt={property.title}
            width={800}
            height={600}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative h-32 md:h-auto">
          <Image
            src={property.side_image1 || property.extra_images?.[0] || property.main_image}
            alt={`${property.title} view`}
            width={400}
            height={300}
            className="w-full h-full object-cover md:rounded-tr-xl cursor-pointer"
            onClick={() => setActiveImage(property.side_image1 || property.extra_images?.[0] || property.main_image)}
          />
        </div>
        
        <div className="relative h-32 md:h-auto">
          <Image
            src={property.side_image2 || property.extra_images?.[1] || property.main_image}
            alt={`${property.title} view`}
            width={400}
            height={300}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setActiveImage(property.side_image2 || property.extra_images?.[1] || property.main_image)}
          />
        </div>
        
        <div className="relative h-32 md:h-auto">
          {property.extra_images?.[2] ? (
            <Image
              src={property.extra_images[2]}
              alt={`${property.title} view`}
              width={400}
              height={300}
              className="w-full h-full object-cover md:rounded-br-xl cursor-pointer"
              onClick={() => setActiveImage(property.extra_images[2])}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center md:rounded-br-xl">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>
        
        <div className="relative h-32 md:h-auto">
          {property.extra_images?.[3] ? (
            <div className="relative h-full">
              <Image
                src={property.extra_images[3]}
                alt={`${property.title} view`}
                width={400}
                height={300}
                className="w-full h-full object-cover rounded-br-xl md:rounded-none cursor-pointer"
                onClick={() => setActiveImage(property.extra_images[3])}
              />
              
              {property.extra_images && property.extra_images.length > 4 && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white font-medium rounded-br-xl md:rounded-none cursor-pointer"
                  onClick={() => alert("Show all photos functionality would go here")}
                >
                  +{property.extra_images.length - 4} photos
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-br-xl md:rounded-none">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Property Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left Column - Description & Amenities */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">About this place</h2>
              <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-6 mb-6">
              <div className="flex items-center">
                <Home size={20} className="mr-2 text-gray-700" />
                <div>
                  <p className="font-medium">{property.number_of_bedrooms} bedroom{property.number_of_bedrooms !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Bed size={20} className="mr-2 text-gray-700" />
                <div>
                  <p className="font-medium">{property.number_of_beds} bed{property.number_of_beds !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Bath size={20} className="mr-2 text-gray-700" />
                <div>
                  <p className="font-medium">{property.number_of_bathrooms} bathroom{property.number_of_bathrooms !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Users size={20} className="mr-2 text-gray-700" />
                <div>
                  <p className="font-medium">Up to {property.number_of_guests} guest{property.number_of_guests !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            
            {property.additional_info && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Additional Info</h3>
                <p className="text-gray-700">{property.additional_info}</p>
              </div>
            )}
          </div>
          
          {/* Amenities */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">What this place offers</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {formatAmenities().map((categoryGroup, groupIndex) => (
                <div key={groupIndex}>
                  <h3 className="text-lg font-medium mb-4">{categoryGroup.category}</h3>
                  <ul className="space-y-4">
                    {categoryGroup.items.map((amenity, index) => (
                      <li key={index} className="flex items-start">
                        {amenity.svg && (
                          <div className="mr-4 text-gray-600" dangerouslySetInnerHTML={{ __html: amenity.svg }}></div>
                        )}
                        <span className="text-gray-700">{amenity.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          {/* Location */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            <p className="text-gray-700 mb-4">{property.location.address}</p>
            
            <div className="h-64 bg-gray-200 rounded-lg overflow-hidden">
              {/* Here you would typically integrate with Google Maps or similar */}
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Map showing location at {property.location.latitude?.toFixed(4) || '0.0000'}, {property.location.longitude?.toFixed(4) || '0.0000'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Price Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">
                  {property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : property.currency === 'GBP' ? '£' : '$'}
                  {property.price}
                </span>
                <span className="text-gray-600 ml-2"> / {property.price_description || 'night'}</span>
              </div>
              
              <div className="flex items-center mt-1">
                <Star size={16} className="text-[var(--primary-red)] mr-1" fill="currentColor" />
                <span className="text-gray-700 text-sm">4.9 · 28 reviews</span>
              </div>
            </div>
            
            {/* Contact Host Button */}
            <button 
              type="button"
              className="w-full bg-[var(--primary-red)] hover:bg-[var(--primary-red-hover)] text-white py-3 px-4 rounded-lg font-medium mb-4 transition-colors"
            >
              Contact Host
            </button>
            
            {/* Property Highlights */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-3">Property highlights</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Star size={16} className="text-[var(--primary-red)] mr-2 mt-1" fill="currentColor" />
                  <span className="text-gray-700">Perfect location with {property.location.city || 'beautiful'} views</span>
                </li>
                <li className="flex items-start">
                  <Star size={16} className="text-[var(--primary-red)] mr-2 mt-1" fill="currentColor" />
                  <span className="text-gray-700">Ideal for groups of {property.number_of_guests} or less</span>
                </li>
                <li className="flex items-start">
                  <Star size={16} className="text-[var(--primary-red)] mr-2 mt-1" fill="currentColor" />
                  <span className="text-gray-700">Free cancellation before Apr 14</span>
                </li>
              </ul>
            </div>
            
            {/* Host Info */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <h3 className="font-medium">Hosted by John</h3>
                  <p className="text-gray-600 text-sm">Host since 2022</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}