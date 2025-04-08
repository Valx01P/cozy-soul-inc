'use client'
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, Home, Users, Bed, Bath, MapPin, MessageCircle, Camera, ChevronRight } from "lucide-react"
import { use } from "react"

export default function PropertyDetail({ params }) {
  // Properly unwrap params using React.use()
  const resolvedParams = use(params)
  const { id } = resolvedParams
  
  const router = useRouter()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImage, setActiveImage] = useState(null)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  
  // Array of all images for gallery view
  const [allImages, setAllImages] = useState([])

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
        setActiveImage(data.main_image)
        
        // Collect all available images
        const images = [
          data.main_image,
          data.side_image1,
          data.side_image2,
          ...(data.extra_images || [])
        ].filter(Boolean) // Filter out undefined/null values
        
        setAllImages(images)
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

  // Initialize Google Maps when property data is available
  useEffect(() => {
    if (!property || !mapRef.current || mapInstanceRef.current) return

    // Function to initialize map after API loads
    const initMap = () => {
      if (window.google && window.google.maps && mapRef.current && !mapInstanceRef.current) {
        const location = { 
          lat: property.location.latitude, 
          lng: property.location.longitude 
        }
        
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: location,
          zoom: 15,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        })
        
        new window.google.maps.Marker({
          position: location,
          map: mapInstance,
          title: property.title
        })
        
        mapInstanceRef.current = mapInstance
      }
    }

    // If Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initMap()
      return
    }

    // Otherwise, load the script
    const script = document.createElement("script")
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`
    script.async = true
    script.defer = true
    
    // Create globally accessible callback
    window.initMap = initMap
    
    document.head.appendChild(script)
    
    return () => {
      if (window.initMap) {
        delete window.initMap
      }
    }
  }, [property])

  const handleGoToListings = () => {
    router.push('/')
  }
  
  const handleContactHost = () => {
    router.push(`/listings/${id}/contact`)
  }

  // Function to format amenities by category
  const formatAmenities = () => {
    if (!property?.amenities) return []
    
    return Object.entries(property.amenities).map(([category, items]) => ({
      category,
      items: Array.isArray(items) ? items : []
    }))
  }
  
  // Function to format the price with commas
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }
  
  // Handle keyboard navigation in the gallery
  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setActiveImage(allImages[index])
    }
  }
  
  // Full screen gallery component
  const PhotoGallery = () => {
    const [currentIndex, setCurrentIndex] = useState(allImages.indexOf(activeImage) || 0)
    
    const goToNext = () => {
      setCurrentIndex((prev) => (prev + 1) % allImages.length)
    }
    
    const goToPrevious = () => {
      setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
    }
    
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="p-4 flex justify-between items-center text-white">
          <button 
            type="button"
            onClick={() => setShowAllPhotos(false)}
            className="flex items-center hover:text-gray-300"
          >
            <ChevronLeft size={24} className="mr-1" />
            Back
          </button>
          <div className="text-sm">
            {currentIndex + 1} / {allImages.length}
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center relative">
          <button 
            type="button"
            onClick={goToPrevious}
            className="absolute left-4 z-10 bg-black/50 rounded-full p-2 text-white hover:bg-black/70"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="w-full h-full flex items-center justify-center p-4">
            <Image
              src={allImages[currentIndex]}
              alt={`Photo ${currentIndex + 1}`}
              width={1200}
              height={800}
              className="max-h-full w-auto max-w-full object-contain"
            />
          </div>
          
          <button 
            type="button"
            onClick={goToNext}
            className="absolute right-4 z-10 bg-black/50 rounded-full p-2 text-white hover:bg-black/70"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        <div className="p-4 overflow-x-auto">
          <div className="flex space-x-2">
            {allImages.map((img, idx) => (
              <div 
                key={idx}
                className={`w-20 h-20 relative flex-shrink-0 cursor-pointer ${
                  idx === currentIndex ? 'ring-2 ring-white' : ''
                }`}
                onClick={() => setCurrentIndex(idx)}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
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
          onClick={handleGoToListings}
          className="flex items-center text-[var(--primary-red)] mb-8 hover:underline"
        >
          <ChevronLeft size={20} className="mr-1" />
          Back to listings
        </button>
        
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
    <>
      {showAllPhotos && <PhotoGallery />}
      
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        {/* Navigation */}
        <button 
          type="button"
          onClick={handleGoToListings}
          className="flex items-center text-[var(--primary-red)] mb-4 md:mb-8 hover:underline"
        >
          <ChevronLeft size={20} className="mr-1" />
          Back to listings
        </button>
        
        {/* Property Title Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{property.title}</h1>
            <div className="flex items-center mt-2 text-gray-600">
              <MapPin size={16} className="mr-1" />
              <span>{`${property.location.city || ''}, ${property.location.state || ''}, ${property.location.country || ''}`}</span>
            </div>
          </div>
        </div>
        
        {/* Image Gallery - UPDATED FOR MOBILE RESPONSIVENESS */}
        <div className="relative mb-8">
          {/* View all photos button */}
          <button 
            type="button"
            onClick={() => setShowAllPhotos(true)}
            className="absolute top-4 right-4 z-10 bg-white rounded-full px-4 py-2 flex items-center text-sm font-medium shadow-md hover:bg-gray-100 transition-colors"
          >
            <Camera size={16} className="mr-2" />
            View all photos
          </button>
          
          {/* Desktop Grid Layout (md and up) */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-4 md:h-[60vh]">
            {/* Main large image (left column) */}
            <div 
              className="col-span-2 row-span-2 relative rounded-l-xl overflow-hidden cursor-pointer"
              onClick={() => setShowAllPhotos(true)}
            >
              <Image
                src={property.main_image}
                alt={property.title}
                fill
                className="object-cover transform transition-transform duration-500 hover:scale-105"
                priority
              />
            </div>
            
            {/* Top right images */}
            <div className="relative overflow-hidden">
              <div
                className="w-full h-full cursor-pointer"
                onClick={() => setActiveImage(property.side_image1)}
                onKeyDown={(e) => handleKeyDown(e, 1)}
                tabIndex={0}
                role="button"
                aria-label="View side image 1"
              >
                <Image
                  src={property.side_image1}
                  alt={`${property.title} side view 1`}
                  fill
                  className="object-cover transform transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
            
            <div className="relative overflow-hidden">
              <div
                className="w-full h-full cursor-pointer"
                onClick={() => setActiveImage(property.side_image2)}
                onKeyDown={(e) => handleKeyDown(e, 2)}
                tabIndex={0}
                role="button"
                aria-label="View side image 2"
              >
                <Image
                  src={property.side_image2}
                  alt={`${property.title} side view 2`}
                  fill
                  className="object-cover rounded-tr-xl transform transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
            
            {/* Bottom right images */}
            <div className="relative overflow-hidden">
              <div
                className="w-full h-full cursor-pointer"
                onClick={() => setActiveImage(property.extra_images[0])}
                onKeyDown={(e) => handleKeyDown(e, 3)}
                tabIndex={0}
                role="button"
                aria-label="View extra image 1"
              >
                <Image
                  src={property.extra_images[0]}
                  alt={`${property.title} extra view 1`}
                  fill
                  className="object-cover transform transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
            
            <div className="relative overflow-hidden">
              {property.extra_images.length > 1 ? (
                <div
                  className="relative w-full h-full cursor-pointer"
                  onClick={() => property.extra_images.length > 1 ? setActiveImage(property.extra_images[1]) : setShowAllPhotos(true)}
                  onKeyDown={(e) => handleKeyDown(e, 4)}
                  tabIndex={0}
                  role="button"
                  aria-label="View extra image 2"
                >
                  <Image
                    src={property.extra_images[1]}
                    alt={`${property.title} extra view 2`}
                    fill
                    className="object-cover rounded-br-xl transform transition-transform duration-500 hover:scale-105"
                  />
                  
                  {/* Calculate how many more images we have after the 4 shown in the grid */}
                  {(property.extra_images.length > 1) && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white font-medium rounded-br-xl cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllPhotos(true);
                      }}
                    >
                      +{allImages.length - 4} more
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-br-xl">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Stack Layout (small screens) */}
          <div className="md:hidden flex flex-col space-y-2">
            {/* Main image */}
            <div 
              className="relative w-full h-64 rounded-t-xl overflow-hidden cursor-pointer"
              onClick={() => setShowAllPhotos(true)}
            >
              <Image
                src={property.main_image}
                alt={property.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            
            {/* Horizontal scroll for small previews */}
            <div className="flex overflow-x-auto space-x-2 pb-2">
              {allImages.slice(1).map((img, idx) => (
                <div 
                  key={idx}
                  className="relative w-28 h-28 flex-shrink-0 cursor-pointer"
                  onClick={() => setShowAllPhotos(true)}
                >
                  <Image
                    src={img}
                    alt={`${property.title} view ${idx + 2}`}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              ))}
              
              {/* Show more button */}
              {allImages.length > 4 && (
                <div 
                  className="relative w-28 h-28 flex-shrink-0 bg-black bg-opacity-60 rounded-md flex items-center justify-center cursor-pointer"
                  onClick={() => setShowAllPhotos(true)}
                >
                  <span className="text-white font-medium text-xs p-1">View all {allImages.length} photos</span>
                </div>
              )}
            </div>
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
                  categoryGroup.items.length > 0 && (
                    <div key={groupIndex}>
                      <h3 className="text-lg font-medium mb-4">{categoryGroup.category}</h3>
                      <ul className="space-y-4">
                        {categoryGroup.items.map((amenity, index) => (
                          <li key={index} className="flex items-start">
                            {amenity.svg && (
                              <div className="mr-4 min-w-6 text-gray-600" dangerouslySetInnerHTML={{ __html: amenity.svg }}></div>
                            )}
                            <span className="text-gray-700">{amenity.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                ))}
              </div>
              
              {formatAmenities().every(group => group.items.length === 0) && (
                <p className="text-gray-500 italic">No amenities listed for this property.</p>
              )}
            </div>
            
            {/* Location with Google Maps */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              <p className="text-gray-700 mb-4">{property.location.address || `${property.location.street}, ${property.location.city}, ${property.location.state}`}</p>
              
              {/* Updated map container with responsive height */}
              <div className="h-80 md:h-96 lg:h-[32rem] bg-gray-200 rounded-lg overflow-hidden shadow-md">
                <div 
                  ref={mapRef} 
                  className="w-full h-full"
                  aria-label={`Map showing location at ${property.location.latitude}, ${property.location.longitude}`}
                ></div>
              </div>
              
              {/* Optional map instructions */}
              <div className="mt-3 text-sm text-gray-500 flex items-center justify-between">
                <span>Tap on map to explore the neighborhood</span>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${property.location.latitude},${property.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary-red)] hover:underline flex items-center"
                >
                  View larger map
                </a>
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
                    {formatPrice(property.price)}
                  </span>
                  <span className="text-gray-600 ml-2"> / {property.price_description || 'night'}</span>
                </div>
              </div>
              
              {/* Contact Host Button */}
              <Link href={`/listings/${id}/contact`}>
                <button 
                  type="button"
                  onClick={handleContactHost}
                  className="w-full bg-[var(--primary-red)] hover:bg-[var(--primary-red-hover)] hover:cursor-pointer text-white py-3 px-4 rounded-lg font-medium mb-4 transition-colors flex items-center justify-center"
                >
                  <MessageCircle size={18} className="mr-2" />
                  Contact Host
                </button>
              </Link>
              
              {/* Property Highlights */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="font-medium text-gray-900 mb-3">Property highlights</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <MapPin size={16} className="text-[var(--primary-red)] mr-2 mt-1" />
                    <span className="text-gray-700">Perfect location in {property.location.city || 'the city'}</span>
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
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <h3 className="font-medium">Hosted by Admin</h3>
                    <p className="text-gray-600 text-sm">Host since 2023</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}