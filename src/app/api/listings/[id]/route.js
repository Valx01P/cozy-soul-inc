// src/app/api/listings/[id]/route.js
import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
import supabase from '@/app/services/supabase'

/**
 * GET a single listing by ID
 * Returns detailed information about the property
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    // Query for the property with joins for location and images
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        id, 
        host_id, 
        title, 
        description, 
        price, 
        price_description,
        currency,
        main_image, 
        side_image1, 
        side_image2,
        number_of_guests, 
        number_of_bedrooms, 
        number_of_beds, 
        number_of_bathrooms,
        additional_info, 
        is_active, 
        created_at, 
        updated_at,
        locations(
          id, 
          address, 
          street, 
          apt, 
          city, 
          state, 
          zip, 
          country, 
          latitude, 
          longitude
        ),
        propertyimages(id, image_url)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 })
      }
      throw new Error(`Error fetching property: ${error.message}`)
    }
    
    // Fetch amenities for this property with categories
    const { data: amenitiesData, error: amenitiesError } = await supabase
      .from('propertyamenities')
      .select(`
        amenities(
          id,
          name,
          svg,
          amenitiescategories(id, name)
        )
      `)
      .eq('property_id', id)
    
    if (amenitiesError) {
      throw new Error(`Error fetching amenities: ${amenitiesError.message}`)
    }
    
    // Organize amenities by category
    const amenities = {}
    
    amenitiesData?.forEach(item => {
      const amenity = item.amenities
      const categoryName = amenity.amenitiescategories.name
      
      if (!amenities[categoryName]) {
        amenities[categoryName] = []
      }
      
      amenities[categoryName].push({
        name: amenity.name,
        svg: amenity.svg
      })
    })
    
    // Format the response
    const location = {
      address: property.locations.address || `${property.locations.street}, ${property.locations.city}, ${property.locations.state}`,
      street: property.locations.street,
      apt: property.locations.apt || '',
      city: property.locations.city,
      state: property.locations.state,
      zip: property.locations.zip,
      country: property.locations.country,
      latitude: property.locations.latitude,
      longitude: property.locations.longitude
    }
    
    const extraImages = property.propertyimages.map(img => img.image_url)
    
    const formattedProperty = {
      id: property.id,
      host_id: property.host_id,
      title: property.title,
      description: property.description,
      price: property.price,
      price_description: property.price_description,
      currency: property.currency,
      main_image: property.main_image,
      side_image1: property.side_image1,
      side_image2: property.side_image2,
      extra_images: extraImages,
      location,
      number_of_guests: property.number_of_guests,
      number_of_bedrooms: property.number_of_bedrooms,
      number_of_beds: property.number_of_beds,
      number_of_bathrooms: property.number_of_bathrooms,
      additional_info: property.additional_info || '',
      amenities,
      is_active: property.is_active,
      created_at: property.created_at,
      updated_at: property.updated_at
    }
    
    return NextResponse.json(formattedProperty)
  } catch (error) {
    console.error('Get listing error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch listing' 
    }, { status: 500 })
  }
}

/**
 * Helper function to delete an image from Supabase storage
 * @param {string} imageUrl - URL of the image to delete
 */
async function deleteImageFromStorage(imageUrl) {
  if (!imageUrl) return
  
  try {
    // Extract the filename from the URL
    const fileName = imageUrl.split('/').pop()
    
    // Delete from Supabase storage
    const { error } = await supabase.storage
      .from('property-images')
      .remove([fileName])
    
    if (error) {
      console.error(`Failed to delete image from storage: ${error.message}`)
    }
  } catch (err) {
    console.error(`Error in deleteImageFromStorage: ${err.message}`)
  }
}

/**
 * PUT update a listing by ID (admin only)
 * Requires authentication and updates property, location, images and amenities
 * Also properly handles image deletion from storage
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    
    // Verify the user's JWT token (admin only)
    const { accessToken } = await getAuthTokens(request)
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    const payload = await verifyToken(accessToken)
    
    if (!payload || !payload.admin_id) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    // Parse request body
    const data = await request.json()
    
    // Validate required fields
    const requiredFields = ['title', 'price', 'price_description', 'location', 'number_of_guests', 'number_of_bedrooms', 'number_of_beds', 'number_of_bathrooms']
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 })
      }
    }
    
    // Location validation
    const locationFields = ['street', 'city', 'state', 'country', 'latitude', 'longitude']
    for (const field of locationFields) {
      if (!data.location[field]) {
        return NextResponse.json({ 
          error: `Missing required location field: ${field}` 
        }, { status: 400 })
      }
    }
    
    // Verify property exists and get current property data
    const { data: existingProperty, error: propertyError } = await supabase
      .from('properties')
      .select('location_id, main_image, side_image1, side_image2')
      .eq('id', id)
      .single()
    
    if (propertyError) {
      if (propertyError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 })
      }
      throw new Error(`Error fetching property: ${propertyError.message}`)
    }
    
    // Get current extra images
    const { data: existingImages, error: imagesError } = await supabase
      .from('propertyimages')
      .select('image_url')
      .eq('property_id', id)
    
    if (imagesError) {
      throw new Error(`Error fetching property images: ${imagesError.message}`)
    }
    
    // 1. Update the location
    const { error: locationError } = await supabase
      .from('locations')
      .update({
        address: data.location.address || `${data.location.street}, ${data.location.city}, ${data.location.state}`,
        street: data.location.street,
        apt: data.location.apt || '',
        city: data.location.city,
        state: data.location.state,
        zip: data.location.zip || '',
        country: data.location.country,
        latitude: data.location.latitude,
        longitude: data.location.longitude
      })
      .eq('id', existingProperty.location_id)
    
    if (locationError) {
      throw new Error(`Error updating location: ${locationError.message}`)
    }
    
    // 2. Handle main image and side images - delete from storage if they've changed
    if (existingProperty.main_image && existingProperty.main_image !== data.main_image) {
      await deleteImageFromStorage(existingProperty.main_image)
    }
    
    if (existingProperty.side_image1 && existingProperty.side_image1 !== data.side_image1) {
      await deleteImageFromStorage(existingProperty.side_image1)
    }
    
    if (existingProperty.side_image2 && existingProperty.side_image2 !== data.side_image2) {
      await deleteImageFromStorage(existingProperty.side_image2)
    }
    
    // 3. Update the property
    const { error: updatePropertyError } = await supabase
      .from('properties')
      .update({
        title: data.title,
        description: data.description || '',
        price: data.price,
        price_description: data.price_description,
        currency: data.currency || 'USD',
        main_image: data.main_image || null,
        side_image1: data.side_image1 || null,
        side_image2: data.side_image2 || null,
        number_of_guests: data.number_of_guests,
        number_of_bedrooms: data.number_of_bedrooms,
        number_of_beds: data.number_of_beds,
        number_of_bathrooms: data.number_of_bathrooms,
        additional_info: data.additional_info || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (updatePropertyError) {
      throw new Error(`Error updating property: ${updatePropertyError.message}`)
    }
    
    // 4. Handle extra images
    if (data.extra_images && Array.isArray(data.extra_images)) {
      // Find images that were removed
      const newImageUrls = new Set(data.extra_images)
      const imagesToDelete = existingImages
        .filter(img => !newImageUrls.has(img.image_url))
        .map(img => img.image_url)
      
      // Delete removed images from storage
      for (const imageUrl of imagesToDelete) {
        await deleteImageFromStorage(imageUrl)
      }
      
      // Delete all existing extra images from the database
      const { error: deleteImagesError } = await supabase
        .from('propertyimages')
        .delete()
        .eq('property_id', id)
      
      if (deleteImagesError) {
        throw new Error(`Error deleting existing images: ${deleteImagesError.message}`)
      }
      
      // Add new images if provided
      if (data.extra_images.length > 0) {
        const extraImagesData = data.extra_images.map(image_url => ({
          property_id: id,
          image_url
        }))
        
        const { error: imagesError } = await supabase
          .from('propertyimages')
          .insert(extraImagesData)
        
        if (imagesError) {
          throw new Error(`Error adding extra images: ${imagesError.message}`)
        }
      }
    }
    
    // 5. Handle amenities if provided - delete existing and add new ones
    if (data.amenities && typeof data.amenities === 'object') {
      // Delete existing amenities
      const { error: deleteAmenitiesError } = await supabase
        .from('propertyamenities')
        .delete()
        .eq('property_id', id)
      
      if (deleteAmenitiesError) {
        throw new Error(`Error deleting existing amenities: ${deleteAmenitiesError.message}`)
      }
      
      // First, fetch all categories to get the category IDs
      const { data: categories, error: categoriesError } = await supabase
        .from('amenitiescategories')
        .select('id, name')
      
      if (categoriesError) {
        throw new Error(`Error fetching amenity categories: ${categoriesError.message}`)
      }
      
      const categoryMap = {}
      categories.forEach(category => {
        categoryMap[category.name] = category.id
      })
      
      // Now fetch all amenities with their categories
      const { data: allAmenities, error: amenitiesError } = await supabase
        .from('amenities')
        .select('id, name, category_id')
      
      if (amenitiesError) {
        throw new Error(`Error fetching amenities: ${amenitiesError.message}`)
      }
      
      // Process each amenity category from the request
      const propertyAmenitiesData = []
      
      for (const [categoryName, amenities] of Object.entries(data.amenities)) {
        // Get the correct category ID for this category
        const categoryId = categoryMap[categoryName]
        
        if (!categoryId) {
          console.warn(`Unknown amenity category: ${categoryName}`)
          continue
        }
        
        if (Array.isArray(amenities)) {
          // If amenities is an array of objects
          amenities.forEach(amenity => {
            // Find the amenity that matches both the name AND the category
            const matchedAmenity = allAmenities.find(a => 
              a.name === amenity.name && a.category_id === categoryId
            )
            
            if (matchedAmenity) {
              propertyAmenitiesData.push({
                property_id: id,
                amenity_id: matchedAmenity.id
              })
            } else {
              console.warn(`Amenity not found or wrong category: ${amenity.name} in ${categoryName}`)
            }
          })
        } else {
          // If amenities is an object with name:boolean pairs
          for (const [amenityName, isSelected] of Object.entries(amenities)) {
            if (isSelected) {
              // Find the amenity that matches both the name AND the category
              const matchedAmenity = allAmenities.find(a => 
                a.name === amenityName && a.category_id === categoryId
              )
              
              if (matchedAmenity) {
                propertyAmenitiesData.push({
                  property_id: id,
                  amenity_id: matchedAmenity.id
                })
              } else {
                console.warn(`Amenity not found or wrong category: ${amenityName} in ${categoryName}`)
              }
            }
          }
        }
      }
      
      if (propertyAmenitiesData.length > 0) {
        const { error: insertError } = await supabase
          .from('propertyamenities')
          .insert(propertyAmenitiesData)
        
        if (insertError) {
          throw new Error(`Error adding amenities: ${insertError.message}`)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Property updated successfully',
      propertyId: id
    })
  } catch (error) {
    console.error('Update listing error:', error)
    return NextResponse.json({ 
      error: 'Failed to update listing' 
    }, { status: 500 })
  }
}

/**
 * DELETE a listing by ID (admin only)
 * Requires authentication and removes property and all related data
 * Also deletes images from Supabase storage
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    
    // Verify the user's JWT token (admin only)
    const { accessToken } = await getAuthTokens(request)
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    const payload = await verifyToken(accessToken)
    
    if (!payload || !payload.admin_id) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    // Get the property data including images before deleting
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('location_id, main_image, side_image1, side_image2')
      .eq('id', id)
      .single()
    
    if (propertyError) {
      if (propertyError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 })
      }
      throw new Error(`Error fetching property: ${propertyError.message}`)
    }
    
    // Get extra images
    const { data: extraImages, error: imagesError } = await supabase
      .from('propertyimages')
      .select('image_url')
      .eq('property_id', id)
    
    if (imagesError) {
      throw new Error(`Error fetching property images: ${imagesError.message}`)
    }
    
    // Delete all images from storage
    if (property.main_image) {
      await deleteImageFromStorage(property.main_image)
    }
    
    if (property.side_image1) {
      await deleteImageFromStorage(property.side_image1)
    }
    
    if (property.side_image2) {
      await deleteImageFromStorage(property.side_image2)
    }
    
    for (const img of extraImages) {
      await deleteImageFromStorage(img.image_url)
    }
    
    // Delete related propertyamenities (junction table)
    const { error: amenitiesError } = await supabase
      .from('propertyamenities')
      .delete()
      .eq('property_id', id)
    
    if (amenitiesError) {
      throw new Error(`Error deleting property amenities: ${amenitiesError.message}`)
    }
    
    // Delete related propertyimages
    const { error: deleteImagesError } = await supabase
      .from('propertyimages')
      .delete()
      .eq('property_id', id)
    
    if (deleteImagesError) {
      throw new Error(`Error deleting property images: ${deleteImagesError.message}`)
    }
    
    // Delete the property
    const { error: deletePropertyError } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
    
    if (deletePropertyError) {
      throw new Error(`Error deleting property: ${deletePropertyError.message}`)
    }
    
    // Delete the location
    const { error: locationError } = await supabase
      .from('locations')
      .delete()
      .eq('id', property.location_id)
    
    if (locationError) {
      throw new Error(`Error deleting location: ${locationError.message}`)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully'
    })
  } catch (error) {
    console.error('Delete listing error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete listing' 
    }, { status: 500 })
  }
}