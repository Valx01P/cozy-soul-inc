
const listingService = {
  getAllListings: async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/listings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      return data
    } catch (error) {
      console.error('Error fetching listings:', error)
      throw error
    }
  },
  getListingById: async (id) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/listings/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error)
      }
      return data
    } catch (error) {
      console.error('Error fetching listing:', error)
      throw error
    }
  },
  createListing: async (listing) => {
  },
  updateListing: async (id, listing) => {
  },
  deleteListing: async (id) => {
  }
}

export default listingService