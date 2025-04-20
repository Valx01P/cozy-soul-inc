'use client'
import React, { useState, useEffect } from 'react'
import listingService from '@/app/services/api/listingService'

export default function PropertyDetail({ params }) {
  const resolvedParams = React.use(params)
  const { id } = resolvedParams

  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchListing = async () => {
    try {
      setLoading(true)
      setError(null)
      // Use the actual id from params
      const fetchedProperty = await listingService.getListingById(id)
      setProperty(fetchedProperty)
    } catch (err) {
      setError(err.message || 'Failed to load property details')
      console.error('Error fetching property:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListing()
  }, [id])

  return (
    <div className="flex flex-1 flex-col justify-center bg-[#F5F5F5] p-4">
      <h1 className="text-2xl font-bold mb-4">Property Detail</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={fetchListing} 
            className="mt-2 bg-red-200 hover:bg-red-300 text-red-800 py-1 px-3 rounded"
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-gray-600">Loading property details...</p>
        </div>
      ) : property && (
        <div className="property-detail bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">{property.title}</h2>
          <p className="text-gray-700 mb-4">{property.description}</p>
          
          {property.main_image && (
            <div className="mb-4">
              <img 
                src={property.main_image} 
                alt={property.title} 
                className="w-full h-64 object-cover rounded-md"
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="font-semibold">Details</h3>
              <p>Guests: {property.number_of_guests}</p>
              <p>Bedrooms: {property.number_of_bedrooms}</p>
              <p>Bathrooms: {property.number_of_bathrooms}</p>
              <p>Beds: {property.number_of_beds}</p>
            </div>
            
            <div>
              <h3 className="font-semibold">Location</h3>
              {property.location && (
                <>
                  <p>{property.location.city}, {property.location.state}</p>
                  <p>{property.location.country}</p>
                </>
              )}
            </div>
          </div>
          
          {property.availability && property.availability.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold">Price</h3>
              <p className="text-xl text-green-700">
                ${property.availability[0].price} / night
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}