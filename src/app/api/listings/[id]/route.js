// src/app/api/listings/[id]/route.js - Updated for Additional Fees
import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
import supabase from '@/app/services/supabase'

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let cache = {
  listings: new Map(), // Map of listings by ID
  timestamps: new Map() // Map of timestamps by ID
};

// Function to invalidate cache for a specific listing
export function invalidateListingCache(id) {
  if (id) {
    cache.listings.delete(id);
    cache.timestamps.delete(id);
  }
}

// Import the function to invalidate the listings cache
let invalidateListingsCache;
try {
  invalidateListingsCache = require('../route').invalidateListingsCache;
} catch (error) {
  invalidateListingsCache = () => {};
  console.error("Unable to import invalidateListingsCache function:", error);
}

/**
 * GET a single listing by ID (ANYONE) - OPTIMIZED
 * Returns detailed information about the property
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }
    
    // Check if we have a valid cached response
    const cachedTimestamp = cache.timestamps.get(id);
    if (cachedTimestamp && Date.now() - cachedTimestamp < CACHE_DURATION) {
      const cachedListing = cache.listings.get(id);
      if (cachedListing) {
        return NextResponse.json(cachedListing, { status: 200 });
      }
    }
    
    // OPTIMIZATION: Single query with all joins
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select(`
        id, 
        host_id, 
        title, 
        description, 
        main_image, 
        side_image1, 
        side_image2,
        minimum_stay,
        number_of_guests, 
        number_of_bedrooms, 
        number_of_beds, 
        number_of_bathrooms,
        additional_info, 
        is_active, 
        created_at, 
        updated_at,
        propertyavailability(
          id,
          start_date,
          end_date,
          is_available,
          price,
          availability_type
        ),
        propertyimages(
          id,
          image_url
        ),
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
        users!properties_host_id_fkey(
          first_name,
          last_name,
          profile_image,
          created_at
        ),
        propertyamenities(
          amenities(
            id,
            name,
            svg,
            amenitiescategories(id, name)
          )
        )
      `)
      .eq('id', id)
      .single()
    
    if (propertyError) {
      if (propertyError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 })
      }
      return NextResponse.json({ error: `Failed to retrieve property: ${propertyError.message}` }, { status: 500 })
    }
    
    // Fetch additional fees
    const { data: additionalFees, error: feesError } = await supabase
      .from('additionalfees')
      .select('id, title, description, cost, type')
      .eq('property_id', id)
    
    if (feesError) {
      console.error('Error fetching additional fees:', feesError);
      // Continue without fees rather than failing the entire request
    }
    
    // OPTIMIZATION: More efficient data processing with better null/undefined handling
    
    // Organize amenities by category
    const amenities = {};
    
    if (property.propertyamenities && property.propertyamenities.length > 0) {
      property.propertyamenities.forEach(item => {
        if (!item.amenities) return;
        
        const amenity = item.amenities;
        if (!amenity.amenitiescategories) return;
        
        const categoryName = amenity.amenitiescategories.name;
        if (!categoryName) return;
        
        if (!amenities[categoryName]) {
          amenities[categoryName] = [];
        }
        
        amenities[categoryName].push({
          name: amenity.name,
          svg: amenity.svg
        });
      });
    }
    
    // Format the location object with proper null checks
    const location = {
      address: property.locations?.address || 
              `${property.locations?.street || ''}, ${property.locations?.city || ''}, ${property.locations?.state || ''}`.replace(/^, /, '').replace(/, $/, ''),
      street: property.locations?.street || '',
      apt: property.locations?.apt || '',
      city: property.locations?.city || '',
      state: property.locations?.state || '',
      zip: property.locations?.zip || '',
      country: property.locations?.country || '',
      latitude: property.locations?.latitude || 0,
      longitude: property.locations?.longitude || 0
    };
    
    // Get extra images with null check
    const extraImages = (property.propertyimages || []).map(img => img.image_url);
    
    // Process availability data with null check
    const availability = (property.propertyavailability || []).map(avail => ({
      id: avail.id,
      start_date: avail.start_date,
      end_date: avail.end_date,
      is_available: avail.is_available,
      price: avail.price,
      availability_type: avail.availability_type
    }));
    
    // Return formatted property object with host info
    const response = {
      id: property.id,
      host_id: property.host_id,
      title: property.title,
      description: property.description,
      availability,
      additional_fees: additionalFees || [],
      main_image: property.main_image,
      side_image1: property.side_image1,
      side_image2: property.side_image2,
      extra_images: extraImages,
      minimum_stay: property.minimum_stay,
      location,
      number_of_guests: property.number_of_guests,
      number_of_bedrooms: property.number_of_bedrooms,
      number_of_beds: property.number_of_beds,
      number_of_bathrooms: property.number_of_bathrooms,
      additional_info: property.additional_info || '',
      amenities,
      is_active: property.is_active,
      created_at: property.created_at,
      updated_at: property.updated_at,
      host: property.users ? {
        first_name: property.users.first_name,
        last_name: property.users.last_name,
        profile_image: property.users.profile_image,
        host_since: property.users.created_at ? new Date(property.users.created_at).getFullYear() : null
      } : null
    };
    
    // Cache the result
    cache.listings.set(id, response);
    cache.timestamps.set(id, Date.now());
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/listings/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
 * PUT update a listing by ID (OWNER ONLY)
 * Requires authentication and updates property, location, images, availability, and amenities
 * Also properly handles image deletion from storage
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }
    
    const { accessToken } = await getAuthTokens(request)
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(accessToken)
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Check if user is admin and owns the property
    const { data: property, error: propertyCheckError } = await supabase
      .from('properties')
      .select('host_id, location_id, main_image, side_image1, side_image2')
      .eq('id', id)
      .single()
    
    if (propertyCheckError) {
      if (propertyCheckError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 })
      }
      return NextResponse.json({ error: `Failed to retrieve property: ${propertyCheckError.message}` }, { status: 500 })
    }
    
    // Verify the user is the owner of this property
    if (property.host_id !== payload.user_id) {
      return NextResponse.json({ error: 'Forbidden - you are not authorized to update this listing' }, { status: 403 })
    }
    
    // Parse request body
    const data = await request.json()
    
    // Validate required fields
    const requiredFields = ['title', 'location', 'number_of_guests', 'number_of_bedrooms', 'number_of_beds', 'number_of_bathrooms']
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }
    
    // Location validation
    const locationFields = ['street', 'city', 'state', 'country', 'latitude', 'longitude']
    for (const field of locationFields) {
      if (!data.location[field]) {
        return NextResponse.json({ error: `Missing required location field: ${field}` }, { status: 400 })
      }
    }
    
    // Get current extra images
    const { data: existingImages, error: imagesError } = await supabase
      .from('propertyimages')
      .select('image_url')
      .eq('property_id', id)
    
    if (imagesError) {
      return NextResponse.json({ error: `Error fetching property images: ${imagesError.message}` }, { status: 500 })
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
      .eq('id', property.location_id)
    
    if (locationError) {
      return NextResponse.json({ error: `Error updating location: ${locationError.message}` }, { status: 500 })
    }
    
    // 2. Handle main image and side images - delete from storage if they've changed
    if (property.main_image && property.main_image !== data.main_image) {
      await deleteImageFromStorage(property.main_image)
    }
    
    if (property.side_image1 && property.side_image1 !== data.side_image1) {
      await deleteImageFromStorage(property.side_image1)
    }
    
    if (property.side_image2 && property.side_image2 !== data.side_image2) {
      await deleteImageFromStorage(property.side_image2)
    }
    
    // 3. Update the property
    const { error: updatePropertyError } = await supabase
      .from('properties')
      .update({
        title: data.title,
        description: data.description || '',
        main_image: data.main_image || null,
        side_image1: data.side_image1 || null,
        side_image2: data.side_image2 || null,
        minimum_stay: data.minimum_stay || 1,
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
      return NextResponse.json({ error: `Error updating property: ${updatePropertyError.message}` }, { status: 500 })
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
        return NextResponse.json({ error: `Error deleting existing images: ${deleteImagesError.message}` }, { status: 500 })
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
          return NextResponse.json({ error: `Error adding extra images: ${imagesError.message}` }, { status: 500 })
        }
      }
    }
    
    // 5. Handle availability if provided
    if (data.availability && Array.isArray(data.availability)) {
      // Validate availability data
      for (const [index, avail] of data.availability.entries()) {
        const availFields = ['start_date', 'end_date', 'price', 'is_available']
        for (const field of availFields) {
          if (avail[field] === undefined) {
            return NextResponse.json({ error: `Missing required availability field: ${field} at index ${index}` }, { status: 400 })
          }
        }
      }
      
      // Delete existing availability ranges
      const { error: deleteAvailError } = await supabase
        .from('propertyavailability')
        .delete()
        .eq('property_id', id)
      
      if (deleteAvailError) {
        return NextResponse.json({ error: `Error deleting existing availability: ${deleteAvailError.message}` }, { status: 500 })
      }
      
      // Insert new availability ranges
      const availabilityData = data.availability.map(avail => ({
        property_id: id,
        start_date: avail.start_date,
        end_date: avail.end_date,
        is_available: avail.is_available,
        price: avail.price,
        availability_type: avail.availability_type || 'default'
      }))
      
      const { error: availabilityError } = await supabase
        .from('propertyavailability')
        .insert(availabilityData)
      
      if (availabilityError) {
        return NextResponse.json({ error: `Error adding availability: ${availabilityError.message}` }, { status: 500 })
      }
    }
    
    // 6. Handle additional fees if provided
    if (data.additional_fees && Array.isArray(data.additional_fees)) {
      // Delete existing fees
      const { error: deleteFeesError } = await supabase
        .from('additionalfees')
        .delete()
        .eq('property_id', id)
      
      if (deleteFeesError) {
        return NextResponse.json({ error: `Error deleting existing fees: ${deleteFeesError.message}` }, { status: 500 })
      }
      
      // Insert new fees if there are any
      if (data.additional_fees.length > 0) {
        const feesData = data.additional_fees.map(fee => ({
          property_id: id,
          title: fee.title,
          description: fee.description || '',
          cost: fee.cost,
          type: fee.type || 'flat'
        }))
        
        const { error: feesError } = await supabase
          .from('additionalfees')
          .insert(feesData)
        
        if (feesError) {
          return NextResponse.json({ error: `Error adding additional fees: ${feesError.message}` }, { status: 500 })
        }
      }
    }
    
    // 7. Handle amenities if provided - delete existing and add new ones
    if (data.amenities && typeof data.amenities === 'object') {
      // Delete existing amenities
      const { error: deleteAmenitiesError } = await supabase
        .from('propertyamenities')
        .delete()
        .eq('property_id', id)
      
      if (deleteAmenitiesError) {
        return NextResponse.json({ error: `Error deleting existing amenities: ${deleteAmenitiesError.message}` }, { status: 500 })
      }
      
      // First, fetch all categories to get the category IDs
      const { data: categories, error: categoriesError } = await supabase
        .from('amenitiescategories')
        .select('id, name')
      
      if (categoriesError) {
        return NextResponse.json({ error: `Error fetching amenity categories: ${categoriesError.message}` }, { status: 500 })
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
        return NextResponse.json({ error: `Error fetching amenities: ${amenitiesError.message}` }, { status: 500 })
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
          return NextResponse.json({ error: `Error adding amenities: ${insertError.message}` }, { status: 500 })
        }
      }
    }
    
    // Invalidate this listing's cache and the listings list cache
    invalidateListingCache(id);
    if (typeof invalidateListingsCache === 'function') {
      invalidateListingsCache();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Property updated successfully',
      propertyId: id
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error in PUT /api/listings/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE a listing by ID (OWNER ONLY)
 * Requires authentication and removes property and all related data
 * Also deletes images from Supabase storage
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }
    
    // Verify the user's JWT token
    const { accessToken } = await getAuthTokens(request)
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(accessToken)
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get the property data including images and check ownership before deleting
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('host_id, location_id, main_image, side_image1, side_image2')
      .eq('id', id)
      .single()
    
    if (propertyError) {
      if (propertyError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 })
      }
      return NextResponse.json({ error: `Error fetching property: ${propertyError.message}` }, { status: 500 })
    }
    
    // Verify the user is the owner of this property
    if (property.host_id !== payload.user_id) {
      return NextResponse.json({ 
        error: 'Forbidden - you are not authorized to delete this listing' 
      }, { status: 403 })
    }
    
    // Get extra images
    const { data: extraImages, error: imagesError } = await supabase
      .from('propertyimages')
      .select('image_url')
      .eq('property_id', id)
    
    if (imagesError) {
      return NextResponse.json({ error: `Error fetching property images: ${imagesError.message}` }, { status: 500 })
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
    
    // Delete related data in the correct order to respect foreign key constraints
    
    // 1. Delete propertyavailability
    const { error: availabilityError } = await supabase
      .from('propertyavailability')
      .delete()
      .eq('property_id', id)
    
    if (availabilityError) {
      return NextResponse.json({ error: `Error deleting property availability: ${availabilityError.message}` }, { status: 500 })
    }
    
    // 2. Delete additionalfees
    const { error: feesError } = await supabase
      .from('additionalfees')
      .delete()
      .eq('property_id', id)
    
    if (feesError) {
      return NextResponse.json({ error: `Error deleting additional fees: ${feesError.message}` }, { status: 500 })
    }
    
    // 3. Delete propertyamenities (junction table)
    const { error: amenitiesError } = await supabase
      .from('propertyamenities')
      .delete()
      .eq('property_id', id)
    
    if (amenitiesError) {
      return NextResponse.json({ error: `Error deleting property amenities: ${amenitiesError.message}` }, { status: 500 })
    }
    
    // 4. Delete propertyimages
    const { error: deleteImagesError } = await supabase
      .from('propertyimages')
      .delete()
      .eq('property_id', id)
    
    if (deleteImagesError) {
      return NextResponse.json({ error: `Error deleting property images: ${deleteImagesError.message}` }, { status: 500 })
    }
    
    // 5. Delete the property
    const { error: deletePropertyError } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
    
    if (deletePropertyError) {
      return NextResponse.json({ error: `Error deleting property: ${deletePropertyError.message}` }, { status: 500 })
    }
    
    // 6. Delete the location
    const { error: locationError } = await supabase
      .from('locations')
      .delete()
      .eq('id', property.location_id)
    
    if (locationError) {
      return NextResponse.json({ error: `Error deleting location: ${locationError.message}` }, { status: 500 })
    }
    
    // Invalidate this listing's cache and the listings list cache
    invalidateListingCache(id);
    if (typeof invalidateListingsCache === 'function') {
      invalidateListingsCache();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully'
    }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/listings/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}