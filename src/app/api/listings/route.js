import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from '@/lib/supabase';
import { isAuthenticated, getAdmin } from '@/lib/auth';

// GET all listings
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('Properties')
      .select(`
        *,
        PropertyTypes(type_name),
        Locations(*),
        Images(*)
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('order_position', { ascending: true })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      );
    }
    
    // Process the data to format it for the frontend
    const listings = data.map(property => {
      // Find primary image
      const primaryImage = property.Images.find(img => img.is_primary) || 
                        property.Images[0] || 
                        { image_url: '/placeholder.jpg' };
      
      return {
        id: property.property_id,
        title: property.title,
        price: property.display_price,
        priceDescription: property.display_price_description,
        type: property.PropertyTypes.type_name,
        bedrooms: property.number_of_bedrooms,
        beds: property.number_of_beds,
        bathrooms: property.number_of_bathrooms,
        guests: property.number_of_guests,
        location: {
          city: property.Locations.city,
          state: property.Locations.state,
          country: property.Locations.country
        },
        primaryImage: primaryImage.image_url,
        order: property.order_position
      };
    });
    
    return NextResponse.json({
      listings,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in listings GET:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// POST a new listing (admin only)
export async function POST(request) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get admin from access token
    const cookieStore = cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const admin = await getAdmin(accessToken);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const listingData = await request.json();
    
    // First, insert location data
    const { data: locationData, error: locationError } = await supabase
      .from('Locations')
      .insert({
        address: listingData.address,
        city: listingData.city,
        state: listingData.state,
        country: listingData.country,
        latitude: listingData.latitude,
        longitude: listingData.longitude
      })
      .select()
      .single();
    
    if (locationError) {
      console.error('Error creating location:', locationError);
      return NextResponse.json(
        { error: 'Failed to create location' },
        { status: 500 }
      );
    }
    
    // Get highest order_position to place new listing at the end
    const { data: orderData } = await supabase
      .from('Properties')
      .select('order_position')
      .order('order_position', { ascending: false })
      .limit(1);
    
    const nextOrderPosition = orderData?.[0]?.order_position 
      ? orderData[0].order_position + 10
      : 10;
    
    // Now, insert the property data
    const { data: propertyData, error: propertyError } = await supabase
      .from('Properties')
      .insert({
        host_id: admin.admin_id,
        title: listingData.title,
        description: listingData.description,
        location_id: locationData.location_id,
        type_id: listingData.typeId,
        display_price: listingData.displayPrice,
        display_price_description: listingData.priceDescription,
        cleaning_fee: listingData.cleaningFee,
        additional_guest_fee: listingData.additionalGuestFee,
        number_of_guests: listingData.numberOfGuests,
        number_of_bedrooms: listingData.numberOfBedrooms,
        number_of_beds: listingData.numberOfBeds,
        number_of_bathrooms: listingData.numberOfBathrooms,
        house_rules: listingData.houseRules,
        cancellation_policy: listingData.cancellationPolicy,
        other_things_to_note: listingData.otherThingsToNote,
        order_position: nextOrderPosition,
        is_active: listingData.isActive !== undefined ? listingData.isActive : true
      })
      .select()
      .single();
    
    if (propertyError) {
      console.error('Error creating property:', propertyError);
      return NextResponse.json(
        { error: 'Failed to create property' },
        { status: 500 }
      );
    }
    
    // If amenities were provided, insert them
    if (listingData.amenities && listingData.amenities.length > 0) {
      const amenityEntries = listingData.amenities.map(amenityId => ({
        property_id: propertyData.property_id,
        amenity_id: amenityId
      }));
      
      const { error: amenitiesError } = await supabase
        .from('PropertyAmenities')
        .insert(amenityEntries);
      
      if (amenitiesError) {
        console.error('Error adding amenities:', amenitiesError);
        // We don't return an error here, as the property was created successfully
      }
    }
    
    return NextResponse.json({
      success: true,
      property: propertyData
    });
  } catch (error) {
    console.error('Error in listings POST:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}