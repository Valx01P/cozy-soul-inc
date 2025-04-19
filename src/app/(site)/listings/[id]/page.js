'use client'
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, Home, Users, Bed, Bath, MapPin, MessageCircle, Camera, ChevronRight, ImageIcon } from "lucide-react"
import { use } from "react"
import listingService from "@/app/services/api/listingService"
import PropertyPriceCard from "../../../components/minimal/site/PropertyPriceCard"

// This component properly formats property descriptions
function PropertyDescription({ description, maxLines = 5 }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!description) return null;
  
  // Function to properly format the description with paragraphs
  const formatDescription = () => {
    if (!description) return null;
    
    // Replace any Windows line breaks with Unix line breaks
    const normalizedText = description.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Split text by double newlines to get paragraphs
    const paragraphs = normalizedText.split(/\n\s*\n/);
    
    // If not expanded, limit to first paragraph or first few lines
    const visibleParagraphs = expanded ? paragraphs : [paragraphs[0]];
    
    return visibleParagraphs.map((paragraph, index) => {
      // Replace single newlines with <br /> tags within each paragraph
      const formattedParagraph = paragraph
        .trim()
        .split('\n')
        .map((line, i) => (
          <span key={i}>
            {line}
            {i < paragraph.split('\n').length - 1 && <br />}
          </span>
        ));
      
      return (
        <p key={index} className="text-gray-700 mb-4">
          {formattedParagraph}
        </p>
      );
    });
  };
  
  const hasMoreContent = description.split(/\n\s*\n/).length > 1;
  
  return (
    <div>
      <div className={!expanded ? "line-clamp-5" : ""}>
        {formatDescription()}
      </div>
      
      {hasMoreContent && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[var(--primary-red)] font-medium hover:underline focus:outline-none mt-1"
        >
          {expanded ? "Show less" : "Read more..."}
        </button>
      )}
    </div>
  );
}


export default function PropertyPage({ params }) {
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

  // Default placeholder image
  const placeholderImage = "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image"

  useEffect(() => {
    async function fetchProperty() {
      try {
        setLoading(true)
        // Use listingService instead of direct fetch
        const data = await listingService.getListingById(id)
        setProperty(data)
        
        // Set active image to the first available image or placeholder
        const mainImage = data.main_image || placeholderImage
        setActiveImage(mainImage)
        
        // Collect all available images, filtering out any null/undefined values
        const validImages = [
          data.main_image,
          data.side_image1,
          data.side_image2,
          ...(data.extra_images || [])
        ].filter(Boolean) // Filter out undefined/null values
        
        // If no images at all, add at least one placeholder
        if (validImages.length === 0) {
          validImages.push(placeholderImage)
        }
        
        setAllImages(validImages)
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
  }, [id, placeholderImage])

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

  // Function to format amenities by category
  const formatAmenities = () => {
    if (!property?.amenities) return []
    
    return Object.entries(property.amenities).map(([category, items]) => ({
      category,
      items: Array.isArray(items) ? items : []
    }))
  }
  
  // Handle keyboard navigation in the gallery
  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setActiveImage(allImages[index])
    }
  }
  
  // Helper function to render image with fallback
  const renderImage = (src, alt, className = "", priority = false) => {
    return (
      <Image
        src={src || placeholderImage}
        alt={alt}
        fill
        className={`object-cover ${className}`}
        priority={priority}
      />
    )
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
    
    // Don't show gallery controls if there's only one image
    const showControls = allImages.length > 1
    
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
          {showControls && (
            <div className="text-sm">
              {currentIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
        
        <div className="flex-1 flex items-center justify-center relative">
          {showControls && (
            <button 
              type="button"
              onClick={goToPrevious}
              className="absolute left-4 z-10 bg-black/50 rounded-full p-2 text-white hover:bg-black/70"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          
          <div className="w-full h-full flex items-center justify-center p-4">
            <Image
              src={allImages[currentIndex]}
              alt={`Photo ${currentIndex + 1}`}
              width={1200}
              height={800}
              className="max-h-full w-auto max-w-full object-contain"
            />
          </div>
          
          {showControls && (
            <button 
              type="button"
              onClick={goToNext}
              className="absolute right-4 z-10 bg-black/50 rounded-full p-2 text-white hover:bg-black/70"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
        
        {showControls && (
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
        )}
      </div>
    )
  }

  // Function to determine which grid layout to use based on number of images
  const getImageGrid = () => {
    const imageCount = allImages.length;
    
    // Only show "View all photos" button if there are actually photos to view
    const showViewAllButton = imageCount > 0;
    
    // Render placeholder if no images
    if (imageCount === 0) {
      return (
        <div className="h-[60vh] flex items-center justify-center bg-gray-100 rounded-xl">
          <div className="text-center">
            <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No images available</p>
          </div>
        </div>
      );
    }
    
    // Return appropriate grid based on image count
    return (
      <div className="relative">
        {/* View all photos button */}
        {showViewAllButton && (
          <button 
            type="button"
            onClick={() => setShowAllPhotos(true)}
            className="absolute top-4 right-4 z-10 bg-white rounded-full px-4 py-2 flex items-center text-sm font-medium shadow-md hover:bg-gray-100 transition-colors"
          >
            <Camera size={16} className="mr-2" />
            View all photos
          </button>
        )}
        
        {/* Desktop Layout */}
        <div className="hidden md:block">
          {/* Single image layout */}
          {imageCount === 1 && (
            <div className="h-[60vh] relative rounded-xl overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
              {renderImage(allImages[0], property?.title || "Property image", "rounded-xl", true)}
            </div>
          )}
          
          {/* Two images layout */}
          {imageCount === 2 && (
            <div className="grid grid-cols-2 gap-4 h-[60vh]">
              <div className="relative rounded-l-xl overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                {renderImage(allImages[0], property?.title || "Property image", "rounded-l-xl", true)}
              </div>
              <div className="relative rounded-r-xl overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                {renderImage(allImages[1], `${property?.title || "Property"} side view`, "rounded-r-xl")}
              </div>
            </div>
          )}
          
          {/* Three images layout */}
          {imageCount === 3 && (
            <div className="grid grid-cols-2 gap-4 h-[60vh]">
              <div className="relative rounded-l-xl overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                {renderImage(allImages[0], property?.title || "Property image", "rounded-l-xl", true)}
              </div>
              <div className="grid grid-rows-2 gap-4">
                <div className="relative rounded-tr-xl overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                  {renderImage(allImages[1], `${property?.title || "Property"} side view 1`, "rounded-tr-xl")}
                </div>
                <div className="relative rounded-br-xl overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                  {renderImage(allImages[2], `${property?.title || "Property"} side view 2`, "rounded-br-xl")}
                </div>
              </div>
            </div>
          )}
          
          {/* Four images layout - NEW! */}
          {imageCount === 4 && (
            <div className="grid grid-cols-2 gap-4 h-[60vh]">
              <div className="relative rounded-l-xl overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                {renderImage(allImages[0], property?.title || "Property image", "rounded-l-xl", true)}
              </div>
              <div className="grid grid-rows-3 gap-4">
                <div className="relative rounded-tr-xl overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                  {renderImage(allImages[1], `${property?.title || "Property"} side view 1`, "rounded-tr-xl")}
                </div>
                <div className="relative overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                  {renderImage(allImages[2], `${property?.title || "Property"} side view 2`)}
                </div>
                <div className="relative rounded-br-xl overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                  {renderImage(allImages[3], `${property?.title || "Property"} side view 3`, "rounded-br-xl")}
                </div>
              </div>
            </div>
          )}
          
          {/* Five or more images layout */}
          {imageCount >= 5 && (
            <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[60vh]">
              {/* Main large image (left column) */}
              <div className="col-span-2 row-span-2 relative rounded-l-xl overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                {renderImage(allImages[0], property?.title || "Property image", "rounded-l-xl", true)}
              </div>
              
              {/* Top right images */}
              <div className="relative overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                {renderImage(allImages[1], `${property?.title || "Property"} side view 1`)}
              </div>
              
              <div className="relative overflow-hidden cursor-pointer rounded-tr-xl" onClick={() => setShowAllPhotos(true)}>
                {renderImage(allImages[2], `${property?.title || "Property"} side view 2`, "rounded-tr-xl")}
              </div>
              
              {/* Bottom right images */}
              <div className="relative overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                {renderImage(allImages[3], `${property?.title || "Property"} extra view 1`)}
              </div>
              
              <div className="relative overflow-hidden cursor-pointer rounded-br-xl" onClick={() => setShowAllPhotos(true)}>
                <div className="relative w-full h-full">
                  {renderImage(allImages[4], `${property?.title || "Property"} extra view 2`, "rounded-br-xl")}
                  
                  {/* Only show the overlay if there are more than 5 images */}
                  {imageCount > 5 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white font-medium rounded-br-xl cursor-pointer" onClick={() => setShowAllPhotos(true)}>
                      +{allImages.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile Layout - Also improved */}
        <div className="md:hidden">
          {/* Main image */}
          <div className="relative w-full h-64 rounded-t-xl overflow-hidden cursor-pointer" onClick={() => setShowAllPhotos(true)}>
            {renderImage(allImages[0], property?.title || "Property image", "rounded-t-xl", true)}
          </div>
          
          {/* Horizontal scroll for small previews - only show if there are additional images */}
          {imageCount > 1 && (
            <div className="flex overflow-x-auto space-x-2 pb-2 mt-2">
              {allImages.slice(1).map((img, idx) => (
                <div 
                  key={idx}
                  className="relative w-28 h-28 flex-shrink-0 cursor-pointer"
                  onClick={() => setShowAllPhotos(true)}
                >
                  <Image
                    src={img}
                    alt={`${property?.title || "Property"} view ${idx + 2}`}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              ))}
              
              {/* Show "View all" button only if there are more than 4 total images */}
              {imageCount > 5 && (
                <div 
                  className="relative w-28 h-28 flex-shrink-0 bg-black bg-opacity-60 rounded-md flex items-center justify-center cursor-pointer"
                  onClick={() => setShowAllPhotos(true)}
                >
                  <span className="text-white font-medium text-xs p-1">View all {allImages.length} photos</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen pt-20">
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
    <main className="pt-6 md:pt-8">
      {showAllPhotos && <PhotoGallery />}
      
      <div className="max-w-7xl mx-auto px-4 pb-12">
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
        
        {/* Image Gallery */}
        <div className="mb-8">
          {getImageGrid()}
        </div>
        
        {/* Property Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Description & Amenities */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">About this place</h2>
                {/* Replace the old description with our new component */}
                <PropertyDescription description={property.description} />
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
                  <PropertyDescription description={property.additional_info} />
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
          
          {/* Right Column - Price Card - Now using our new component */}
          <div className="lg:col-span-1">
            <PropertyPriceCard property={property} id={id} />
          </div>
        </div>
      </div>
    </main>
  )
}