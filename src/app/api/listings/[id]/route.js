import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';

// GET a single listing by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const { data, error } = await supabase
      .from('Properties')
      .select(`
        *,
        PropertyTypes(type_name),
        Locations(*),
        Images(*),
        Admins(first_name, last_name, email),
        PropertyAmenities(
          Amenities(*)
        )
      `)
      .eq('property_id', id)
      .single();
    
    if (error) {
      console.error('Error fetching listing:', error);
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    // Organize images by type
    const images = {
      primary: data.Images.find(img => img.is_primary) || null,
      beds: data.Images.filter(img => img.is_bed),
      others: data.Images.filter(img => !img.is_primary && !img.is_bed)
        .sort((a, b) => a.display_order - b.display_order)
    };
    
    // Format amenities
    const amenities = data.PropertyAmenities.map(pa => pa.Amenities);
    
    // Format the listing data
    const listing = {
      id: data.property_id,
      title: data.title,
      description: data.description,
      price: data.display_price,
      priceDescription: data.display_price_description,
      cleaningFee: data.cleaning_fee,
      additionalGuestFee: data.additional_guest_fee,
      type: data.PropertyTypes.type_name,
      location: {
        address: data.Locations.address,
        city: data.Locations.city,
        state: data.Locations.state,
        country: data.Locations.country,
        latitude: data.Locations.latitude,
        longitude: data.Locations.longitude
      },
      host: {
        firstName: data.Admins.first_name,
        lastName: data.Admins.last_name,
        email: data.Admins.email
      },
      capacity: {
        guests: data.number_of_guests,
        bedrooms: data.number_of_bedrooms,
        beds: data.number_of_beds,
        bathrooms: data.number_of_bathrooms
      },
      amenities,
      images,
      houseRules: data.house_rules,
      cancellationPolicy: data.cancellation_policy,
      otherThingsToNote: data.other_things_to_note,
      isActive: data.is_active
    };
    
    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error in listing GET:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// PUT to update a listing (admin only)
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Check authentication
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const updateData = await request.json();
    
    // First, update location if provided
    if (updateData.location) {
      // Get the current property to find the location_id
      const { data: property } = await supabase
        .from('Properties')
        .select('location_id')
        .eq('property_id', id)
        .single();
      
      if (property) {
        const { error: locationError } = await supabase
          .from('Locations')
          .update({
            address: updateData.location.address,
            city: updateData.location.city,
            state: updateData.location.state,
            country: updateData.location.country,
            latitude: updateData.location.latitude,
            longitude: updateData.location.longitude
          })
          .eq('location_id', property.location_id);
        
        if (locationError) {
          console.error('Error updating location:', locationError);
        }
      }
    }
    
    // Update the property data
    const propertyUpdate = {};
    
    // Map fields from updateData to database fields
    if (updateData.title) propertyUpdate.title = updateData.title;
    if (updateData.description) propertyUpdate.description = updateData.description;
    if (updateData.typeId) propertyUpdate.type_id = updateData.typeId;
    if (updateData.displayPrice) propertyUpdate.display_price = updateData.displayPrice;
    if (updateData.priceDescription) propertyUpdate.display_price_description = updateData.priceDescription;
    if ('cleaningFee' in updateData) propertyUpdate.cleaning_fee = updateData.cleaningFee;
    if ('additionalGuestFee' in updateData) propertyUpdate.additional_guest_fee = updateData.additionalGuestFee;
    if (updateData.numberOfGuests) propertyUpdate.number_of_guests = updateData.numberOfGuests;
    if (updateData.numberOfBedrooms) propertyUpdate.number_of_bedrooms = updateData.numberOfBedrooms;
    if (updateData.numberOfBeds) propertyUpdate.number_of_beds = updateData.numberOfBeds;
    if (updateData.numberOfBathrooms) propertyUpdate.number_of_bathrooms = updateData.numberOfBathrooms;
    if ('houseRules' in updateData) propertyUpdate.house_rules = updateData.houseRules;
    if ('cancellationPolicy' in updateData) propertyUpdate.cancellation_policy = updateData.cancellationPolicy;
    if ('otherThingsToNote' in updateData) propertyUpdate.other_things_to_note = updateData.otherThingsToNote;
    if ('isActive' in updateData) propertyUpdate.is_active = updateData.isActive;
    if ('orderPosition' in updateData) propertyUpdate.order_position = updateData.orderPosition;
    
    // Always update the updated_at timestamp
    propertyUpdate.updated_at = new Date().toISOString();
    
    const { data: updatedProperty, error: propertyError } = await supabase
      .from('Properties')
      .update(propertyUpdate)
      .eq('property_id', id)
      .select()
      .single();
    
    if (propertyError) {
      console.error('Error updating property:', propertyError);
      return NextResponse.json(
        { error: 'Failed to update property' },
        { status: 500 }
      );
    }
    
    // Update amenities if provided
    if (updateData.amenities) {
      // First, delete existing amenities
      const { error: deleteError } = await supabase
        .from('PropertyAmenities')
        .delete()
        .eq('property_id', id);
      
      if (deleteError) {
        console.error('Error deleting amenities:', deleteError);
      }
      
      // Then insert new ones
      if (updateData.amenities.length > 0) {
        const amenityEntries = updateData.amenities.map(amenityId => ({
          property_id: id,
          amenity_id: amenityId
        }));
        
        const { error: amenitiesError } = await supabase
          .from('PropertyAmenities')
          .insert(amenityEntries);
        
        if (amenitiesError) {
          console.error('Error adding amenities:', amenitiesError);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      property: updatedProperty
    });
  } catch (error) {
    console.error('Error in listing PUT:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE a listing (admin only)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Check authentication
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // First, delete all related records
    
    // 1. Delete amenities associations
    const { error: amenitiesError } = await supabase
      .from('PropertyAmenities')
      .delete()
      .eq('property_id', id);
    
    if (amenitiesError) {
      console.error('Error deleting amenities:', amenitiesError);
      // Continue with deletion anyway
    }
    
    // 2. Get the location_id before deleting the property
    const { data: property } = await supabase
      .from('Properties')
      .select('location_id')
      .eq('property_id', id)
      .single();
    
    // 3. Delete images
    const { error: imagesError } = await supabase
      .from('Images')
      .delete()
      .eq('property_id', id);
    
    if (imagesError) {
      console.error('Error deleting images:', imagesError);
      // Continue with deletion anyway
    }
    
    // 4. Delete the property
    const { error: propertyError } = await supabase
      .from('Properties')
      .delete()
      .eq('property_id', id);
    
    if (propertyError) {
      console.error('Error deleting property:', propertyError);
      return NextResponse.json(
        { error: 'Failed to delete property' },
        { status: 500 }
      );
    }
    
    // 5. Delete the location
    if (property && property.location_id) {
      const { error: locationError } = await supabase
        .from('Locations')
        .delete()
        .eq('location_id', property.location_id);
      
      if (locationError) {
        console.error('Error deleting location:', locationError);
        // Continue anyway as the main property is deleted
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully'
    });
  }
  catch (error) {
    console.error('Error in listing DELETE:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}