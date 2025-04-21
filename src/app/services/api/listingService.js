// src/app/services/api/listingService.js - Fixed image handling
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
      console.log("Sending update with data:", listingData)
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
    if (!imageUrl || imageUrl === "") return true;
    
    try {
      // Extract just the filename from the URL
      const urlParts = imageUrl.split('/property-images/')
      if (urlParts.length < 2) {
        console.warn(`Could not extract path from URL: ${imageUrl}`)
        return false;
      }
      const filePath = urlParts[1]

      console.log(`Attempting to delete image path: ${filePath}`)

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
        console.error(`Error response from delete: ${data.error || 'Unknown error'}`)
        throw new Error(data.error || 'Failed to delete image')
      }

      console.log(`Successfully deleted image: ${imageUrl}`)
      return true
    } catch (error) {
      console.error(`Error deleting image (${imageUrl}): ${error.message}`)
      // Continue execution even if deletion fails
      return false
    }
  },

  // Batch delete multiple images
  deleteMultipleImages: async (imageUrls) => {
    if (!imageUrls || !imageUrls.length) return true;

    // Filter out any empty URLs
    const uniqueUrls = [...new Set(imageUrls.filter(url => url && url.trim() !== ""))];
    
    if (!uniqueUrls.length) {
      console.log("No valid URLs to delete");
      return true;
    }

    console.log(`Attempting to delete ${uniqueUrls.length} images:`, uniqueUrls);
    
    const results = await Promise.all(
      uniqueUrls.map(async (url) => {
        try {
          const result = await listingService.deleteImage(url);
          return result;
        } catch (error) {
          console.error(`Failed to delete image ${url}: ${error.message}`);
          // Continue execution even if individual deletion fails
          return false;
        }
      })
    );

    // Count successes and failures
    const successes = results.filter(result => result).length;
    const failures = results.filter(result => !result).length;
    
    console.log(`Deletion complete: ${successes} successful, ${failures} failed`);
    
    // Return true if all deletions were successful, false otherwise
    return failures === 0;
  }
}

export default listingService