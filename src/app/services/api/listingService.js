// src/app/services/api/listingService.js
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

  createListing: async (listingData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(listingData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create listing')
      }

      return data
    } catch (error) {
      console.error('Error creating listing:', error)
      throw error
    }
  },

  updateListing: async (id, listingData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/listings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(listingData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update listing')
      }

      return data
    } catch (error) {
      console.error(`Error updating listing (ID: ${id}):`, error)
      throw error
    }
  },

  deleteListing: async (id) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/listings/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete listing')
      }

      return data
    } catch (error) {
      console.error(`Error deleting listing (ID: ${id}):`, error)
      throw error
    }
  },

  // Image handling methods
  uploadImages: async (imageFiles) => {
    try {
      const formData = new FormData()
      
      // Add all images to form data
      for (const file of imageFiles) {
        if (file instanceof File) {
          formData.append('images', file)
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload images')
      }

      // Normalize response format
      if (Array.isArray(data)) {
        return data; // API returns array of URLs directly
      } else if (data.urls && Array.isArray(data.urls)) {
        return data.urls; // API returns object with urls property
      } else {
        return []; // No URLs returned
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      throw error
    }
  },

  deleteImage: async (imageUrl) => {
    try {
      // Extract just the filename from the URL
      const urlParts = imageUrl.split('/property-images/')
      if (urlParts.length < 2) {
        throw new Error(`Could not extract path from URL: ${imageUrl}`)
      }
      const filePath = urlParts[1]

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/upload`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ filepath: filePath })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete image')
      }

      return true
    } catch (error) {
      console.error(`Error deleting image: ${error.message}`)
      throw error
    }
  },

  // Batch delete multiple images
  deleteMultipleImages: async (imageUrls) => {
    if (!imageUrls || !imageUrls.length) return true

    const uniqueUrls = [...new Set(imageUrls.filter(url => url))]
    if (!uniqueUrls.length) return true

    const results = await Promise.all(
      uniqueUrls.map(async (url) => {
        try {
          await listingService.deleteImage(url)
          return true
        } catch (error) {
          console.error(`Failed to delete image ${url}: ${error.message}`)
          return false
        }
      })
    )

    return results.every(result => result)
  }
}

export default listingService