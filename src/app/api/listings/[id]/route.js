// src/app/api/listings/[id]/route.js
import { NextResponse } from 'next/server';
import SupabaseService from '@/app/services/SupabaseService';
import { verifyToken, getAuthTokens } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

const propertiesService = new SupabaseService('Properties');
const locationsService = new SupabaseService('Locations');
const propertyImagesService = new SupabaseService('PropertyImages');
const propertyAmenitiesService = new SupabaseService('PropertyAmenities');

/**
 * GET a single listing by ID
 * Returns detailed property information with amenities
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Invalid property ID' 
      }, { status: 400 });
    }
    
    // Fetch property with related data
    const { data: property, error } = await supabase
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
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Property not found' 
        }, { status: 404 });
      }
      throw new Error(`Error fetching property: ${error.message}`);
    }
    
    if (!property) {
      return NextResponse.json({ 
        error: 'Property not found' 
      }, { status: 404 });
    }
    
    // Fetch amenities for this property
    const { data: amenitiesData, error: amenitiesError } = await supabase
      .from('PropertyAmenities')
      .select(`
        Amenities(
          id,
          name,
          category_id,
          AmenitiesCategories(name)
        )
      `)
      .eq('property_id', id);
    
    if (amenitiesError) {
      throw new Error(`Error fetching amenities: ${amenitiesError.message}`);
    }
    
    // Organize amenities by category
    const amenities = {};
    
    amenitiesData?.forEach(item => {
      const amenity = item.Amenities;
      const categoryName = amenity.AmenitiesCategories.name;
      
      if (!amenities[categoryName]) {
        amenities[categoryName] = {};
      }
      
      amenities[categoryName][amenity.name] = true;
    });
    
    // Format location
    const location = {
      address: property.Locations.address || `${property.Locations.street}, ${property.Locations.city}, ${property.Locations.state}`,
      street: property.Locations.street,
      apt: property.Locations.apt || '',
      city: property.Locations.city,
      state: property.Locations.state,
      zip: property.Locations.zip,
      country: property.Locations.country,
      latitude: property.Locations.latitude,
      longitude: property.Locations.longitude
    };

    
    // Format extra images
// src/app/api/listings/[id]/route.js (continued)
    // Format extra images
    const extraImages = property.PropertyImages?.map(img => img.image_url) || [];
    
    // Format response
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
    };
    
    return NextResponse.json(formattedProperty);
  } catch (error) {
    console.error('Fetch property error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch property details' 
    }, { status: 500 });
  }
}

/**
 * PUT to update a listing (admin only)
 * Updates property details, location and amenities
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Invalid property ID' 
      }, { status: 400 });
    }
    
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
    
    // Get existing property to verify ownership and location_id
    const existingProperty = await propertiesService.get_by_id(id);
    
    if (!existingProperty) {
      return NextResponse.json({ 
        error: 'Property not found' 
      }, { status: 404 });
    }
    
    // Optional: Verify that the admin is the host of this property
    if (existingProperty.host_id !== payload.admin_id) {
      return NextResponse.json({ 
        error: 'You do not have permission to update this property' 
      }, { status: 403 });
    }
    
    // Parse request body
    const data = await request.json();
    
    // 1. Update location if provided
    if (data.location) {
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
      
      await locationsService.update(existingProperty.location_id, locationData);
    }
    
    // 2. Update property
    const propertyData = {
      title: data.title,
      description: data.description,
      price: data.price,
      price_description: data.price_description,
      currency: data.currency,
      main_image: data.main_image,
      side_image1: data.side_image1,
      side_image2: data.side_image2,
      number_of_guests: data.number_of_guests,
      number_of_bedrooms: data.number_of_bedrooms,
      number_of_beds: data.number_of_beds,
      number_of_bathrooms: data.number_of_bathrooms,
      additional_info: data.additional_info,
      is_active: data.is_active,
      updated_at: new Date().toISOString()
    };
    
    // Remove undefined fields to avoid overwriting with null
    Object.keys(propertyData).forEach(key => {
      if (propertyData[key] === undefined) {
        delete propertyData[key];
      }
    });
    
    await propertiesService.update(id, propertyData);
    
    // 3. Update extra images if provided
    if (data.extra_images && Array.isArray(data.extra_images)) {
      // First delete existing extra images
      await propertyImagesService.delete_by_field('property_id', id);
      
      // Then add new ones
      if (data.extra_images.length > 0) {
        const imagePromises = data.extra_images.map(imageUrl => 
          propertyImagesService.save({
            property_id: id,
            image_url: imageUrl
          })
        );
        
        await Promise.all(imagePromises);
      }
    }
    
    // 4. Update amenities if provided
    if (data.amenities && typeof data.amenities === 'object') {
      // Fetch all amenities to get IDs
      const { data: allAmenities, error } = await supabase
        .from('Amenities')
        .select('id, name');
      
      if (error) {
        throw new Error(`Error fetching amenities: ${error.message}`);
      }
      
      const amenityMap = {};
      
      // Create a map of amenity name to ID for quick lookup
      allAmenities.forEach(amenity => {
        amenityMap[amenity.name] = amenity.id;
      });
      
      // First delete existing property amenities
      await propertyAmenitiesService.delete_by_field('property_id', id);
      
      // Then add new ones
      const amenityPromises = [];
      
      for (const category of Object.values(data.amenities)) {
        for (const [amenityName, isSelected] of Object.entries(category)) {
          if (isSelected && amenityMap[amenityName]) {
            amenityPromises.push(
              propertyAmenitiesService.save({
                property_id: id,
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
      message: 'Property updated successfully'
    });
  } catch (error) {
    console.error('Update property error:', error);
    return NextResponse.json({ 
      error: 'Failed to update property' 
    }, { status: 500 });
  }
}

/**
 * DELETE a listing (admin only)
 * Removes property and related data
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Invalid property ID' 
      }, { status: 400 });
    }
    
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
    
    // Get existing property to verify ownership and location_id
    const existingProperty = await propertiesService.get_by_id(id);
    
    if (!existingProperty) {
      return NextResponse.json({ 
        error: 'Property not found' 
      }, { status: 404 });
    }
    
    // Optional: Verify that the admin is the host of this property
    if (existingProperty.host_id !== payload.admin_id) {
      return NextResponse.json({ 
        error: 'You do not have permission to delete this property' 
      }, { status: 403 });
    }
    
    // Get images to delete from storage later
    const { data: propertyImages } = await supabase
      .from('PropertyImages')
      .select('image_url')
      .eq('property_id', id);
    
    const imagesToDelete = [];
    
    if (existingProperty.main_image) {
      imagesToDelete.push(existingProperty.main_image);
    }
    
    if (existingProperty.side_image1) {
      imagesToDelete.push(existingProperty.side_image1);
    }
    
    if (existingProperty.side_image2) {
      imagesToDelete.push(existingProperty.side_image2);
    }
    
    if (propertyImages && propertyImages.length > 0) {
      propertyImages.forEach(img => {
        if (img.image_url) {
          imagesToDelete.push(img.image_url);
        }
      });
    }
    
    // Delete the property (this will cascade delete property_amenities and property_images)
    await propertiesService.delete(id);
    
    // Delete the location
    await locationsService.delete(existingProperty.location_id);
    
    // Delete images from storage bucket if needed
    if (imagesToDelete.length > 0) {
      // Extract filenames from URLs
      const fileNames = imagesToDelete.map(url => {
        const parts = url.split('/');
        return parts[parts.length - 1];
      });
      
      // Create a storage service instance
      const storageService = new SupabaseService('property-images');
      
      try {
        await storageService.delete_multiple_images('property-images', fileNames);
      } catch (storageError) {
        console.error('Error deleting images from storage:', storageError);
        // Continue with the response even if image deletion fails
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete property' 
    }, { status: 500 });
  }
}

// import { NextResponse } from 'next/server';


// // GET a single listing by ID
// export async function GET(request, { params }) {

// }

// // PUT to update a listing (admin only)
// export async function PUT(request, { params }) {

// }

// // DELETE a listing (admin only)
// export async function DELETE(request, { params }) {

// }