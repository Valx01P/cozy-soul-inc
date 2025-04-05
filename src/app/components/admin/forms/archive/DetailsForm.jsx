"use client"

import { useState, useEffect } from "react"

export function DetailsForm() {
  // State for form data
  const [formData, setFormData] = useState({
    number_of_guests: 1,
    number_of_bedrooms: 1,
    number_of_beds: 1,
    additional_info: "",
    amenities: {}
  })

  // State for amenities data
  const [amenitiesData, setAmenitiesData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  
  // Fetch amenities data on component mount
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        // In production, this would fetch from your API or database
        // For now, we're using the data from the JSON file you provided
        const response = await fetch('/json/icons.json')
        const data = await response.json()
        setAmenitiesData(data.amenities)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching amenities:", error)
        setIsLoading(false)
      }
    }
    
    fetchAmenities()
  }, [])

  // Handle basic form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // Handle amenity selection/deselection
  const handleAmenityChange = (category, amenityName) => {
    setFormData(prev => {
      // Create a deep copy of the amenities object
      const updatedAmenities = JSON.parse(JSON.stringify(prev.amenities || {}))
      
      // Initialize the category if it doesn't exist
      if (!updatedAmenities[category]) {
        updatedAmenities[category] = {}
      }
      
      // Toggle the amenity value
      updatedAmenities[category][amenityName] = !updatedAmenities[category][amenityName]
      
      // Remove the property if it's false to keep the data clean
      if (updatedAmenities[category][amenityName] === false) {
        delete updatedAmenities[category][amenityName]
        
        // Remove empty categories
        if (Object.keys(updatedAmenities[category]).length === 0) {
          delete updatedAmenities[category]
        }
      }
      
      return {
        ...prev,
        amenities: updatedAmenities
      }
    })
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form submitted with data:", formData)
    alert(JSON.stringify(formData, null, 2))
  }

  // Check if an amenity is selected
  const isAmenitySelected = (category, amenityName) => {
    return formData.amenities?.[category]?.[amenityName] === true
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--primary-red)] border-t-transparent rounded-full mb-4"></div>
          <p>Loading amenities...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Property Details</h2>
      <p className="text-gray-600 mb-6">
        Tell guests about your space and what makes it special.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        {/* Basic Details Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Basic Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="number_of_guests" className="block text-sm font-medium text-gray-700 mb-1">
                Max Guests
              </label>
              <input
                type="number"
                id="number_of_guests"
                name="number_of_guests"
                min="1"
                max="50"
                value={formData.number_of_guests}
                onChange={handleInputChange}
                className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              />
            </div>
            
            <div>
              <label htmlFor="number_of_bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                id="number_of_bedrooms"
                name="number_of_bedrooms"
                min="0"
                max="20"
                value={formData.number_of_bedrooms}
                onChange={handleInputChange}
                className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              />
            </div>
            
            <div>
              <label htmlFor="number_of_beds" className="block text-sm font-medium text-gray-700 mb-1">
                Beds
              </label>
              <input
                type="number"
                id="number_of_beds"
                name="number_of_beds"
                min="1"
                max="50"
                value={formData.number_of_beds}
                onChange={handleInputChange}
                className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700 mb-1">
              House Rules & Additional Information
            </label>
            <textarea
              id="additional_info"
              name="additional_info"
              rows="4"
              value={formData.additional_info}
              onChange={handleInputChange}
              placeholder="Example: No smoking, no pets. Check-in after 3 PM, check-out before 11 AM."
              className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
            />
          </div>
        </div>
        
        {/* Amenities Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Amenities</h3>
          <p className="text-sm text-gray-500 mb-4">Select the amenities your property offers to guests.</p>
          
          <div className="space-y-8">
            {Object.entries(amenitiesData).map(([category, amenities]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-medium text-gray-800">{category}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {amenities.map((amenity, index) => (
                    <div 
                      key={`${category}-${index}`}
                      onClick={() => handleAmenityChange(category, amenity.name)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                        ${isAmenitySelected(category, amenity.name) 
                          ? 'border-[var(--primary-red)] bg-[#FFF0F4]' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex-shrink-0 w-6 h-6 relative">
                        {amenity.svg ? (
                          <div dangerouslySetInnerHTML={{ __html: amenity.svg }} />
                        ) : (
                          <div className="w-6 h-6 bg-gray-200 rounded"></div>
                        )}
                        
                        <div className={`
                          absolute -top-1 -right-1 w-4 h-4 rounded-full border 
                          ${isAmenitySelected(category, amenity.name)
                            ? 'bg-[var(--primary-red)] border-[var(--primary-red)]'
                            : 'bg-white border-gray-300'
                          }
                        `}>
                          {isAmenitySelected(category, amenity.name) && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      <span className="text-sm">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full rounded-lg bg-[var(--primary-red)] px-6 py-3 text-white font-medium hover:bg-[var(--primary-red-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-red)] focus:ring-offset-2 transition duration-200"
        >
          Save Property Details
        </button>
      </form>
    </div>
  )
}