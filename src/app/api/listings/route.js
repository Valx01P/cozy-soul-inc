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
    
    // Apply filters if provided
    if (isActive !== null) {
      const activeFilter = isActive === 'true'
      query = query.eq('is_active', activeFilter)
    }
    
    // Apply pagination
    const start = page * limit
    const end = start + limit - 1
    query = query.range(start, end)
    
    // Supabase query
    const { data: properties, error: propertyError } = await query
  
    if (propertyError){
      if (propertyError.code === 'PGRST116') {
        return NextResponse.json({ error: 'No properties found' }, { status: 404 })
      }
      return NextResponse.json({ error: `Failed to retrieve properties: ${propertyError.message}` }, { status: 500 })
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
      if (amenitiesError.code === 'PGRST116') {
        return NextResponse.json({ error: 'No amenities found' }, { status: 404 })
      }
      return NextResponse.json({ error: `Failed to retrieve amenities: ${amenitiesError.message}` }, { status: 500 })
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
    const response = properties.map(property => {
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
      
      // Process availability data
      const availability = property.propertyavailability.map(avail => ({
        id: avail.id,
        start_date: avail.start_date,
        end_date: avail.end_date,
        is_available: avail.is_available,
        price: avail.price,
        availability_type: avail.availability_type
      }))
      
      // Return formatted property object
      return {
        id: property.id,
        host_id: property.host_id,
        title: property.title,
        description: property.description,
        availability,
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
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}










/**
 * POST a new listing (ADMINS ONLY)
 * Creates a new property with location, availability ranges, and amenities
 * Example Request Body:
{
  "title": "Luxury Beachfront Villa",
  "description": "Experience paradise in this stunning beachfront villa with panoramic ocean views and private access to white sand beaches.",
  "main_image": "https://placehold.co/1024x1024/png?text=Main+Villa+Image",
  "side_image1": "https://placehold.co/1024x1024/png?text=Side+View+1",
  "side_image2": "https://placehold.co/1024x1024/png?text=Side+View+2",
  "extra_images": [
    "https://placehold.co/1024x1024/png?text=Pool+Area",
    "https://placehold.co/1024x1024/png?text=Master+Bedroom",
    "https://placehold.co/1024x1024/png?text=Kitchen",
    "https://placehold.co/1024x1024/png?text=Dining+Area"
  ],
  "location": {
    "address": "123 Ocean Drive, Malibu, CA",
    "street": "123 Ocean Drive",
    "apt": "",
    "city": "Malibu",
    "state": "CA",
    "zip": "90265",
    "country": "USA",
    "latitude": 34.0259,
    "longitude": -118.7798
  },
  "number_of_guests": 8,
  "number_of_bedrooms": 4,
  "number_of_beds": 5,
  "number_of_bathrooms": 4,
  "additional_info": "House rules: No parties or events. Not suitable for pets. No smoking. Check-in after 3 PM, check-out before 11 AM. Additional cleaning fee applies. The property has 3 full bathrooms and 1 half bathroom.",
  "is_active": true,
  "availability": [
    {
      "start_date": "2025-06-01",
      "end_date": "2025-06-14",
      "is_available": true,
      "price": 750.00,
      "availability_type": "default"
    },
    {
      "start_date": "2025-06-15",
      "end_date": "2025-06-30",
      "is_available": true,
      "price": 850.00,
      "availability_type": "default"
    },
    {
      "start_date": "2025-07-01",
      "end_date": "2025-07-15",
      "is_available": true,
      "price": 950.00,
      "availability_type": "default"
    },
    {
      "start_date": "2025-07-16",
      "end_date": "2025-07-31",
      "is_available": false,
      "price": 950.00,
      "availability_type": "blocked"
    },
    {
      "start_date": "2025-08-01",
      "end_date": "2025-08-31",
      "is_available": true,
      "price": 850.00,
      "availability_type": "default"
    }
  ],
  "amenities": {
    "Scenic Views": [
      {"name": "Beach view"},
      {"name": "Ocean view"}
    ],
    "Bathroom": [
      {"name": "Hot water"},
      {"name": "Bathtub"},
      {"name": "Shower gel"},
      {"name": "Shampoo"}
    ],
    "Bedroom and laundry": [
      {"name": "Washer"},
      {"name": "Dryer"},
      {"name": "Bed linens"},
      {"name": "Extra pillows and blankets"}
    ],
    "Entertainment": [
      {"name": "TV"},
      {"name": "Bluetooth sound system"}
    ],
    "Heating and cooling": [
      {"name": "Air conditioning"},
      {"name": "Ceiling fan"}
    ],
    "Home safety": [
      {"name": "Smoke alarm"},
      {"name": "Carbon monoxide alarm"},
      {"name": "Fire extinguisher"},
      {"name": "First aid kit"}
    ],
    "Internet and office": [
      {"name": "Wifi"},
      {"name": "Dedicated workspace"}
    ],
    "Kitchen and dining": [
      {"name": "Kitchen"},
      {"name": "Refrigerator"},
      {"name": "Dishwasher"},
      {"name": "Microwave"},
      {"name": "Coffee maker"},
      {"name": "Wine glasses"},
      {"name": "Dining table"}
    ],
    "Location features": [
      {"name": "Beach access - Beachfront"},
      {"name": "Waterfront"}
    ],
    "Outdoor": [
      {"name": "Outdoor furniture"},
      {"name": "Outdoor dining area"},
      {"name": "Patio or balcony"}
    ],
    "Parking and facilities": [
      {"name": "Free parking on premises"},
      {"name": "Pool"}
    ],
    "Services": [
      {"name": "Self check-in"},
      {"name": "Smart lock"}
    ]
  }
}
*/
export async function POST(request) {
  try {
    const { accessToken } = await getAuthTokens(request)
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const payload = await verifyToken(accessToken)

    /**
     * @example Payload:
     * {
     *   "user_id": "123",
     *   "first_name": "John",
     *   "last_name": "Doe",
     *   "email": "user@example.com",
     *   "role": "guest",
     *   "email_verified": false,
     *   "phone_verified": false,
     *   "identity_verified": false
     * }
     */

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
    
    // 5. Add amenities if provided
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
    
    // 6. Fetch the created property with all its relations to return
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
    const extraImages = createdProperty.propertyimages.map(img => img.image_url)
    
    // Process availability data
    const availability = createdProperty.propertyavailability.map(avail => ({
      id: avail.id,
      start_date: avail.start_date,
      end_date: avail.end_date,
      is_available: avail.is_available,
      price: avail.price,
      availability_type: avail.availability_type
    }))
    
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
    }
    
    const response = {
      id: createdProperty.id,
      host_id: createdProperty.host_id,
      title: createdProperty.title,
      description: createdProperty.description,
      availability,
      main_image: createdProperty.main_image,
      side_image1: createdProperty.side_image1,
      side_image2: createdProperty.side_image2,
      extra_images: extraImages,
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
    
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
