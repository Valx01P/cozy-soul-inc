// src/app/api/listings/route.js
import { NextResponse } from 'next/server';
import SupabaseService from '@/app/services/SupabaseService';
import { verifyToken, getAuthTokens } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

const propertiesService = new SupabaseService('Properties');
const locationsService = new SupabaseService('Locations');
const propertyImagesService = new SupabaseService('PropertyImages');
const propertyAmenitiesService = new SupabaseService('PropertyAmenities');
const amenitiesService = new SupabaseService('Amenities');
const amenityCategoriesService = new SupabaseService('AmenitiesCategories');

/**
 * GET all listings with optional filtering
 * 
 * @example Query Parameters:
 * ?page=1&limit=10&active=true
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const isActive = url.searchParams.get('active');
    
    // Base query for properties with location join
    let query = supabase
      .from('Properties')
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
        Locations!inner(
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
        PropertyImages(id, image_url)
      `);
    
    // Apply filters if provided
    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      query = query.eq('is_active', activeFilter);
    }
    
    // Apply pagination
    const start = page * limit;
    const end = start + limit - 1;
    query = query.range(start, end);
    
    const { data: properties, error } = await query;
    
    if (error) {
      throw new Error(`Error fetching properties: ${error.message}`);
    }
    
    if (!properties || properties.length === 0) {
      return NextResponse.json({ Properties: [] });
    }
    
    // Fetch amenities for all properties
    const propertyIds = properties.map(property => property.id);
    const { data: amenitiesData, error: amenitiesError } = await supabase
      .from('PropertyAmenities')
      .select(`
        property_id,
        Amenities(
          id,
          name,
          category_id,
          AmenitiesCategories(name)
        )
      `)
      .in('property_id', propertyIds);
    
    if (amenitiesError) {
      throw new Error(`Error fetching amenities: ${amenitiesError.message}`);
    }
    
    // Organize amenities by property and category
    const amenitiesByProperty = {};
    
    amenitiesData?.forEach(item => {
      const propertyId = item.property_id;
      const amenity = item.Amenities;
      const categoryName = amenity.AmenitiesCategories.name;
      
      if (!amenitiesByProperty[propertyId]) {
        amenitiesByProperty[propertyId] = {};
      }
      
      if (!amenitiesByProperty[propertyId][categoryName]) {
        amenitiesByProperty[propertyId][categoryName] = {};
      }
      
      amenitiesByProperty[propertyId][categoryName][amenity.name] = true;
    });
    
    // Format the response
    const formattedProperties = properties.map(property => {
      // Format the location object
      const location = {
        address: `${property.Locations.street}, ${property.Locations.city}, ${property.Locations.state}`,
        street: property.Locations.street,
        apt: property.Locations.apt || '',
        city: property.Locations.city,
        state: property.Locations.state,
        zip: property.Locations.zip,
        country: property.Locations.country,
        latitude: property.Locations.latitude,
        longitude: property.Locations.longitude
      };
      
      // Get extra images
      const extraImages = property.PropertyImages.map(img => img.image_url);
      
      // Get amenities for this property
      const amenities = amenitiesByProperty[property.id] || {};
      
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
      };
    });
    
    return NextResponse.json({ Properties: formattedProperties });
  } catch (error) {
    console.error('Fetch listings error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch listings' 
    }, { status: 500 });
  }
}

/**
 * POST a new listing (admin only)
 * Creates a new property with location and amenities
 */
export async function POST(request) {
  try {
    // Verify the user's JWT token (admin only)
    const { accessToken } = getAuthTokens(request);
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const payload = await verifyToken(accessToken);
    
    if (!payload || !payload.admin_id) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'price', 'price_description', 'location', 'number_of_guests', 'number_of_bedrooms', 'number_of_beds', 'number_of_bathrooms'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 });
      }
    }
    
    // Location validation
    const locationFields = ['street', 'city', 'state', 'country', 'latitude', 'longitude'];
    for (const field of locationFields) {
      if (!data.location[field]) {
        return NextResponse.json({ 
          error: `Missing required location field: ${field}` 
        }, { status: 400 });
      }
    }
    
    // 1. First, create the location
    const locationData = {
      address: data.location.address || `${data.location.street}, ${data.location.city}, ${data.location.state}`,
      street: data.location.street,
      apt: data.location.apt || '',
      city: data.location.city,
      state: data.location.state,
      zip: data.location.zip || '',
      country: data.location.country,
      latitude: data.location.latitude,
      longitude: data.location.longitude
    };
    
    const location = await locationsService.save(locationData);
    
    // 2. Create the property
    const propertyData = {
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
    };
    
    const property = await propertiesService.save(propertyData);
    
    // 3. Add extra images if provided
    if (data.extra_images && Array.isArray(data.extra_images) && data.extra_images.length > 0) {
      const imagePromises = data.extra_images.map(imageUrl => 
        propertyImagesService.save({
          property_id: property.id,
          image_url: imageUrl
        })
      );
      
      await Promise.all(imagePromises);
    }
    
    // 4. Add amenities if provided
    if (data.amenities && typeof data.amenities === 'object') {
      // Fetch all amenities to get IDs
      const allAmenities = await amenitiesService.get_all();
      const amenityMap = {};
      
      // Create a map of amenity name to ID for quick lookup
      allAmenities.forEach(amenity => {
        amenityMap[amenity.name] = amenity.id;
      });
      
      // Process each amenity category
      const amenityPromises = [];
      
      for (const [category, amenities] of Object.entries(data.amenities)) {
        for (const [amenityName, isSelected] of Object.entries(amenities)) {
          if (isSelected && amenityMap[amenityName]) {
            amenityPromises.push(
              propertyAmenitiesService.save({
                property_id: property.id,
                amenity_id: amenityMap[amenityName]
              })
            );
          }
        }
      }
      
      if (amenityPromises.length > 0) {
        await Promise.all(amenityPromises);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Property created successfully',
      propertyId: property.id
    });
  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json({ 
      error: 'Failed to create listing' 
    }, { status: 500 });
  }
}

// import { NextResponse } from 'next/server';


// // GET all listings
// export async function GET(request) {
//   try {

//   } catch (error) {

    
//   }
// }

// // POST a new listing (admin only)
// export async function POST(request) {
//   try {

//   } catch (error) {

//   }
// }