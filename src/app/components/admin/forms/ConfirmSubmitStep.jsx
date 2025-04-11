"use client"

import { useEffect } from "react"
import usePropertyFormStore from "../../../stores/propertyFormStore"

// Reusable component for formatting property descriptions with proper paragraphs
function FormattedDescription({ description }) {
  if (!description) return null;
  
  // Function to properly format the description with paragraphs
  const formatDescription = () => {
    if (!description) return null;
    
    // Replace any Windows line breaks with Unix line breaks
    const normalizedText = description.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Split text by double newlines to get paragraphs
    const paragraphs = normalizedText.split(/\n\s*\n/);
    
    return paragraphs.map((paragraph, index) => {
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
        <p key={index} className="text-gray-600 mb-3">
          {formattedParagraph}
        </p>
      );
    });
  };
  
  return <>{formatDescription()}</>;
}

export function ConfirmSubmitStep() {
  // Get all data from the store
  const {
    title,
    description,
    price,
    price_description,
    custom_price_description,
    currency,
    main_image,
    side_image1,
    side_image2,
    extra_images,
    location,
    number_of_guests,
    number_of_bedrooms,
    number_of_beds,
    number_of_bathrooms,
    additional_info,
    amenities,
    imagePreviews
  } = usePropertyFormStore((state) => state)

  // Use custom price description if selected
  const finalPriceDescription = price_description === 'custom' 
    ? custom_price_description 
    : price_description

  // Get currency symbol
  const getCurrencySymbol = (code) => {
    const currencies = {
      "USD": "$",
      "EUR": "€",
      "GBP": "£",
      "CAD": "$",
      "AUD": "$"
    }
    return currencies[code] || "$"
  }

  // Log current data on component mount for debugging
  useEffect(() => {
    console.log("Confirm step - Current amenities:", amenities)
  }, [amenities])

  return (
    <div className="space-y-10">
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-xl font-bold mb-4">Review Your Listing</h2>
        <p className="text-gray-600">
          Please review all the information below before submitting your property listing.
        </p>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="mb-4">
            <h4 className="font-medium text-lg">{title}</h4>
            {/* Use our formatted description component instead of a plain paragraph */}
            <FormattedDescription description={description} />
          </div>
          
          <div className="flex items-center text-lg font-semibold text-[var(--primary-red)]">
            {getCurrencySymbol(currency)}{parseFloat(price).toFixed(2)} <span className="text-sm font-normal text-gray-600 ml-1">/ {finalPriceDescription}</span>
          </div>
        </div>
      </div>

      {/* Property Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Images</h3>
        
        <div className="space-y-4">
          {/* Main and side images */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {imagePreviews.main_image && (
              <div className="sm:col-span-3">
                <div className="bg-gray-100 rounded-lg h-64 relative overflow-hidden">
                  <img 
                    src={imagePreviews.main_image} 
                    alt="Main property" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-1 rounded font-medium">
                    Main Image
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 col-span-3 gap-4">
              {imagePreviews.side_image1 && (
                <div className="aspect-square overflow-hidden rounded-lg relative">
                  <img 
                    src={imagePreviews.side_image1} 
                    alt="Side view 1" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-1 rounded font-medium">
                    Side Image 1
                  </div>
                </div>
              )}
              
              {imagePreviews.side_image2 && (
                <div className="aspect-square overflow-hidden rounded-lg relative">
                  <img 
                    src={imagePreviews.side_image2} 
                    alt="Side view 2" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-1 rounded font-medium">
                    Side Image 2
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Extra images grid */}
          {imagePreviews.extra_images && imagePreviews.extra_images.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Images</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {imagePreviews.extra_images.map((src, index) => (
                  <div key={index} className="aspect-square overflow-hidden rounded-lg">
                    <img 
                      src={src} 
                      alt={`Additional view ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Location</h3>
        
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="space-y-2">
            <p className="font-medium">{location.street}{location.apt ? `, ${location.apt}` : ''}</p>
            <p>{location.city}, {location.state} {location.zip}</p>
            <p>{location.country}</p>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Property Details</h3>
        
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-gray-500 text-sm">Guests</p>
              <p className="font-semibold">{number_of_guests}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Bedrooms</p>
              <p className="font-semibold">{number_of_bedrooms}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Beds</p>
              <p className="font-semibold">{number_of_beds}</p>
            </div>
          </div>
          
          {additional_info && (
            <div>
              <p className="text-gray-500 text-sm mb-1">House Rules & Additional Information</p>
              {/* Format the additional info with proper line breaks too */}
              <FormattedDescription description={additional_info} />
            </div>
          )}
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Amenities</h3>
        
        <div className="bg-gray-50 rounded-xl p-6">
          {Object.keys(amenities || {}).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(amenities).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium">{category}</h4>
                  <ul className="space-y-1">
                    {Object.keys(items).map(amenity => (
                      <li key={amenity} className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[var(--primary-red)]">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        <span>{amenity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No amenities selected.</p>
          )}
        </div>
      </div>
    </div>
  )
}