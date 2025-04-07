// src/app/api/listings/route.js
import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
import supabase from '@/app/services/supabase'

/**
 * GET all listings with optional filtering
 * 
 * @example Query Parameters:
 * ?page=1&limit=10&active=true
 */
export async function GET(request) {
  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '0')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const isActive = url.searchParams.get('active')
    
    // Base query for properties with location join
    let query = supabase
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
    
    // Apply filters if provided
    if (isActive !== null) {
      const activeFilter = isActive === 'true'
      query = query.eq('is_active', activeFilter)
    }
    
    // Apply pagination
    const start = page * limit
    const end = start + limit - 1
    query = query.range(start, end)
    
    const { data: properties, error } = await query
    
    if (error) {
      throw new Error(`Error fetching properties: ${error.message}`)
    }
    
    if (!properties || properties.length === 0) {
      return NextResponse.json({ properties: [] })
    }
    
    // Fetch amenities for all properties with categories
    const propertyIds = properties.map(property => property.id)
    const { data: amenitiesData, error: amenitiesError } = await supabase
      .from('propertyamenities')
      .select(`
        property_id,
        amenities(
          id,
          name,
          svg,
          amenitiescategories(id, name)
        )
      `)
      .in('property_id', propertyIds)
    
    if (amenitiesError) {
      throw new Error(`Error fetching amenities: ${amenitiesError.message}`)
    }
    
    // Organize amenities by property and category
    const amenitiesByProperty = {}
    
    amenitiesData?.forEach(item => {
      const propertyId = item.property_id
      const amenity = item.amenities
      const categoryName = amenity.amenitiescategories.name
      
      if (!amenitiesByProperty[propertyId]) {
        amenitiesByProperty[propertyId] = {}
      }
      
      if (!amenitiesByProperty[propertyId][categoryName]) {
        amenitiesByProperty[propertyId][categoryName] = []
      }
      
      amenitiesByProperty[propertyId][categoryName].push({
        name: amenity.name,
        svg: amenity.svg
      })
    })
    
    // Format the response
    const formattedProperties = properties.map(property => {
      // Format the location object
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
      
      // Get extra images
      const extraImages = property.propertyimages.map(img => img.image_url)
      
      // Get amenities for this property
      const amenities = amenitiesByProperty[property.id] || {}
      
      // Return formatted property object
      return {
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
    })
    
    return NextResponse.json({ properties: formattedProperties })
  } catch (error) {
    console.error('Fetch listings error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch listings' 
    }, { status: 500 })
  }
}















/**
 * POST a new listing (admin only)
 * Creates a new property with location and amenities
 */export async function POST(request) {
  try {
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
    
    // 1. First, create the location
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert({
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
      .select()
      .single()
    
    if (locationError) {
      throw new Error(`Error creating location: ${locationError.message}`)
    }
    
    // 2. Create the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert({
        host_id: payload.admin_id,
        title: data.title,
        description: data.description || '',
        price: data.price,
        price_description: data.price_description,
        currency: data.currency || 'USD',
        main_image: data.main_image || null,
        side_image1: data.side_image1 || null,
        side_image2: data.side_image2 || null,
        location_id: location.id,
        number_of_guests: data.number_of_guests,
        number_of_bedrooms: data.number_of_bedrooms,
        number_of_beds: data.number_of_beds,
        number_of_bathrooms: data.number_of_bathrooms,
        additional_info: data.additional_info || '',
        is_active: data.is_active !== undefined ? data.is_active : true
      })
      .select()
      .single()
    
    if (propertyError) {
      throw new Error(`Error creating property: ${propertyError.message}`)
    }
    
    // 3. Add extra images if provided
    if (data.extra_images && Array.isArray(data.extra_images) && data.extra_images.length > 0) {
      const extraImagesData = data.extra_images.map(image_url => ({
        property_id: property.id,
        image_url
      }))
      
      const { error: imagesError } = await supabase
        .from('propertyimages')
        .insert(extraImagesData)
      
      if (imagesError) {
        throw new Error(`Error adding extra images: ${imagesError.message}`)
      }
    }
    
    // 4. Add amenities if provided
    if (data.amenities && typeof data.amenities === 'object') {
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
                property_id: property.id,
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
                  property_id: property.id,
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
      message: 'Property created successfully',
      propertyId: property.id
    })
  } catch (error) {
    console.error('Create listing error:', error)
    return NextResponse.json({ 
      error: 'Failed to create listing' 
    }, { status: 500 })
  }
}