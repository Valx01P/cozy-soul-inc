// src/app/api/listings/route.js - Updated for Additional Fees
import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
import supabase from '@/app/services/supabase'

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let cache = {
  listings: new Map(), // Map of cached listings by query params
  timestamps: new Map(), // Map of timestamps by query params
};

// Function to invalidate cache
export function invalidateListingsCache() {
  cache.listings.clear();
  cache.timestamps.clear();
}

/**
 * GET all listings with optional filtering and caching
 * @example Query Parameters: ?page=1&limit=10&active=true
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const isActive = url.searchParams.get('active');
    
    // Create a cache key based on the query parameters
    const cacheKey = `page=${page}-limit=${limit}-active=${isActive}`;
    
    // Check if we have a valid cached response
    const cachedTimestamp = cache.timestamps.get(cacheKey);
    if (cachedTimestamp && Date.now() - cachedTimestamp < CACHE_DURATION) {
      const cachedData = cache.listings.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData, { status: 200 });
      }
    }
    
    // Calculate pagination
    const start = page * limit;
    const end = start + limit - 1;

    // Base query for all data
    let query = supabase
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
        locations (
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
        propertyavailability (
          id,
          start_date,
          end_date,
          is_available,
          price,
          availability_type
        ),
        propertyimages (
          id,
          image_url
        ),
        propertyamenities (
          amenities (
            id,
            name,
            svg,
            amenitiescategories (
              id,
              name
            )
          )
        )
      `);
    
    // FIXED: Apply filters only if provided
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    
    // Apply pagination
    query = query.range(start, end);
    
    // Execute query
    const { data: properties, error: propertyError } = await query;
    
    if (propertyError) {
      if (propertyError.code === 'PGRST116') {
        return NextResponse.json({ error: 'No properties found' }, { status: 404 });
      }
      return NextResponse.json({ error: `Failed to retrieve properties: ${propertyError.message}` }, { status: 500 });
    }
    
    // Fetch additional fees for all properties
    const propertyIds = properties.map(p => p.id);
    let additionalFees = [];
    
    if (propertyIds.length > 0) {
      const { data: fees, error: feesError } = await supabase
        .from('additionalfees')
        .select('id, property_id, title, description, cost, type')
        .in('property_id', propertyIds);
      
      if (!feesError) {
        additionalFees = fees || [];
      } else {
        console.error('Error fetching additional fees:', feesError);
        // Continue without fees rather than failing the entire request
      }
    }
    
    // Process data more efficiently
    const response = properties.map(property => {
      // Format location
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
      
      // Get extra images
      const extraImages = property.propertyimages 
        ? property.propertyimages.map(img => img.image_url)
        : [];
      
      // Process availability data
      const availability = property.propertyavailability 
        ? property.propertyavailability.map(avail => ({
            id: avail.id,
            start_date: avail.start_date,
            end_date: avail.end_date,
            is_available: avail.is_available,
            price: avail.price,
            availability_type: avail.availability_type
          }))
        : [];
      
      // Get additional fees for this property
      const propertyFees = additionalFees.filter(fee => fee.property_id === property.id);
      
      // Organize amenities efficiently
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
      
      // Return formatted property object
      return {
        id: property.id,
        host_id: property.host_id,
        title: property.title,
        description: property.description,
        availability,
        additional_fees: propertyFees,
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
        updated_at: property.updated_at
      };
    });
    
    // Cache the result
    cache.listings.set(cacheKey, response);
    cache.timestamps.set(cacheKey, Date.now());
    
    // Return formatted properties
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/listings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST a new listing (ADMINS ONLY)
 * Creates a new property with location, availability ranges, and amenities
 */
export async function POST(request) {
  try {
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
    
    const data = await request.json()
    
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
    
    // Availability validation
    if (data.availability && Array.isArray(data.availability)) {
      for (const [index, avail] of data.availability.entries()) {
        const availFields = ['start_date', 'end_date', 'price', 'is_available']
        for (const field of availFields) {
          if (avail[field] === undefined) {
            return NextResponse.json({ error: `Missing required availability field: ${field} at index ${index}` }, { status: 400 })
          }
        }
      }
    }
    
    // TRANSACTION: Use a transaction to ensure all operations succeed or fail together
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

    if (locationError) {
      return NextResponse.json({ error: `Error creating location: ${locationError.message}` }, { status: 500 })
    }
    
    if (!location || location.length === 0) {
      return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
    }
    
    // 2. Create the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert({
        host_id: payload.user_id,
        title: data.title,
        description: data.description || '',
        main_image: data.main_image || null,
        side_image1: data.side_image1 || null,
        side_image2: data.side_image2 || null,
        minimum_stay: data.minimum_stay || 1,
        location_id: location[0].id,
        number_of_guests: data.number_of_guests,
        number_of_bedrooms: data.number_of_bedrooms,
        number_of_beds: data.number_of_beds,
        number_of_bathrooms: data.number_of_bathrooms,
        additional_info: data.additional_info || '',
        is_active: data.is_active !== undefined ? data.is_active : true
      })
      .select()
    
    if (propertyError) {
      return NextResponse.json({ error: `Error creating property: ${propertyError.message}` }, { status: 500 })
    }
    
    if (!property || property.length === 0) {
      return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
    }
    
    const propertyId = property[0].id
    
    // 3. Add extra images if provided
    if (data.extra_images && Array.isArray(data.extra_images) && data.extra_images.length > 0) {
      const extraImagesData = data.extra_images.map(image_url => ({
        property_id: propertyId,
        image_url
      }))
      
      const { error: imagesError } = await supabase
        .from('propertyimages')
        .insert(extraImagesData)
      
      if (imagesError) {
        return NextResponse.json({ error: `Error adding extra images: ${imagesError.message}` }, { status: 500 })
      }
    }
    
    // 4. Add availability if provided
    if (data.availability && Array.isArray(data.availability) && data.availability.length > 0) {
      const availabilityData = data.availability.map(avail => ({
        property_id: propertyId,
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
    
    // 5. Add additional fees if provided
    if (data.additional_fees && Array.isArray(data.additional_fees) && data.additional_fees.length > 0) {
      const feesData = data.additional_fees.map(fee => ({
        property_id: propertyId,
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
    
    // 6. Add amenities if provided
    if (data.amenities && typeof data.amenities === 'object') {
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
                property_id: propertyId,
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
                  property_id: propertyId,
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
    
    // 7. Fetch the created property with all its relations to return
    const { data: createdProperty, error: fetchError } = await supabase
      .from('properties')
      .select(`
        id, 
        host_id, 
        title, 
        description, 
        propertyavailability(
          id,
          start_date,
          end_date,
          is_available,
          price,
          availability_type
        ),
        main_image, 
        side_image1, 
        side_image2,
        propertyimages(
          id,
          image_url
        ),
        minimum_stay,
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
        )
      `)
      .eq('id', propertyId)
      .single()
    
    if (fetchError) {
      return NextResponse.json({ 
        success: true,
        message: 'Property created successfully, but unable to fetch complete details',
        property_id: propertyId
      })
    }
    
    // Get additional fees for this property
    const { data: additionalFees, error: feesError } = await supabase
      .from('additionalfees')
      .select('id, title, description, cost, type')
      .eq('property_id', propertyId)
    
    // Format the response
    const propertyLocation = {
      address: createdProperty.locations.address || `${createdProperty.locations.street}, ${createdProperty.locations.city}, ${createdProperty.locations.state}`,
      street: createdProperty.locations.street,
      apt: createdProperty.locations.apt || '',
      city: createdProperty.locations.city,
      state: createdProperty.locations.state,
      zip: createdProperty.locations.zip,
      country: createdProperty.locations.country,
      latitude: createdProperty.locations.latitude,
      longitude: createdProperty.locations.longitude
    }
    
    // Get extra images
    const extraImages = createdProperty.propertyimages ?
      createdProperty.propertyimages.map(img => img.image_url) :
      [];
    
    // Process availability data
    const availability = createdProperty.propertyavailability ?
      createdProperty.propertyavailability.map(avail => ({
        id: avail.id,
        start_date: avail.start_date,
        end_date: avail.end_date,
        is_available: avail.is_available,
        price: avail.price,
        availability_type: avail.availability_type
      })) :
      [];
    
    // Get amenities for this property
    const { data: propertyAmenities, error: amenitiesQueryError } = await supabase
      .from('propertyamenities')
      .select(`
        amenities(
          id,
          name,
          svg,
          amenitiescategories(id, name)
        )
      `)
      .eq('property_id', propertyId)
    
    let amenities = {}
    
    if (!amenitiesQueryError && propertyAmenities) {
      // Organize amenities by category
      propertyAmenities.forEach(item => {
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
    
    const response = {
      id: createdProperty.id,
      host_id: createdProperty.host_id,
      title: createdProperty.title,
      description: createdProperty.description,
      availability,
      additional_fees: additionalFees || [],
      main_image: createdProperty.main_image,
      side_image1: createdProperty.side_image1,
      side_image2: createdProperty.side_image2,
      extra_images: extraImages,
      minimum_stay: createdProperty.minimum_stay,
      location: propertyLocation,
      number_of_guests: createdProperty.number_of_guests,
      number_of_bedrooms: createdProperty.number_of_bedrooms,
      number_of_beds: createdProperty.number_of_beds,
      number_of_bathrooms: createdProperty.number_of_bathrooms,
      additional_info: createdProperty.additional_info || '',
      amenities,
      is_active: createdProperty.is_active,
      created_at: createdProperty.created_at,
      updated_at: createdProperty.updated_at
    }
    
    // Invalidate the cache as we've added a new listing
    invalidateListingsCache();
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/listings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}