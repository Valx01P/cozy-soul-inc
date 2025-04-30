'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import listingService from '@/app/services/api/listingService'

// Create context
const ListingContext = createContext()

// Custom hook to use the listing context
export const useListings = () => {
  const context = useContext(ListingContext)
  if (!context) {
    throw new Error('useListings must be used within a ListingProvider')
  }
  return context
}

export const ListingProvider = ({ children }) => {
  const [listings, setListings] = useState([])
  const [listingPrices, setListingPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all listings
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await listingService.getAllListings()
        
        // Process and store listings
        setListings(data)
        
        // Calculate prices for all listings at once
        const prices = {}
        data.forEach(listing => {
          prices[listing.id] = calculatePriceForListing(listing)
        })
        setListingPrices(prices)
      } catch (err) {
        console.error('Error fetching listings:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  // Calculate price for the next 5 available consecutive nights
  const calculatePriceForListing = (listing) => {
    if (!listing.availability || listing.availability.length === 0) {
      return { price: 0, nights: 5 }
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
      return { price: 0, nights: 5 }
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
      price: totalPrice,
      nights: nightsCalculated,
      currency: "USD",
      formattedPrice: `$${totalPrice.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })}`
    }
  }

  // Get a specific listing by ID
  const getListingById = async (id) => {
    try {
      const listing = await listingService.getListingById(id)
      return listing
    } catch (err) {
      console.error(`Error fetching listing with ID ${id}:`, err)
      throw err
    }
  }

  // Get price info for a specific listing
  const getListingPriceInfo = (listingId) => {
    return listingPrices[listingId] || { price: 0, nights: 5 }
  }

  const value = {
    listings,
    listingPrices,
    loading,
    error,
    getListingById,
    getListingPriceInfo
  }

  return (
    <ListingContext.Provider value={value}>
      {children}
    </ListingContext.Provider>
  )
}