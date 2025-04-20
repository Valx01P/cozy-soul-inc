import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

/**
 * Returns all reservations from every user for admin
 * Requires valid access token with admin role
 */
export async function GET(request) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get URL search params for pagination and filters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status'); // Filter by status if provided
    const userId = url.searchParams.get('userId'); // Filter by user if provided
    const propertyId = url.searchParams.get('propertyId'); // Filter by property if provided
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('reservations')
      .select(`
        id,
        property_id,
        user_id,
        check_in_date,
        check_out_date,
        guests_count,
        total_price,
        status,
        created_at,
        users!user_id(
          id,
          first_name,
          last_name,
          email,
          profile_image
        ),
        properties!property_id(
          id,
          title,
          main_image,
          host_id,
          host:host_id(
            id,
            first_name,
            last_name
          )
        ),
        payment_plans(
          id
        )
      `, { count: 'exact' });
    
    // Apply filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }
    
    // Apply pagination and ordering
    const { data: reservations, error: reservationsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reservationsError) {
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
    }
    
    // Format the response
    const formattedReservations = reservations.map(reservation => {
      const guest = reservation.users;
      const property = reservation.properties;
      const hasPaymentPlan = reservation.payment_plans && reservation.payment_plans.length > 0;
      
      return {
        id: reservation.id,
        propertyId: reservation.property_id,
        userId: reservation.user_id,
        checkInDate: reservation.check_in_date,
        checkOutDate: reservation.check_out_date,
        guestsCount: reservation.guests_count,
        totalPrice: reservation.total_price,
        status: reservation.status,
        createdAt: reservation.created_at,
        hasPaymentPlan: hasPaymentPlan,
        guest: guest ? {
          id: guest.id,
          name: `${guest.first_name} ${guest.last_name}`,
          email: guest.email,
          profileImage: guest.profile_image
        } : null,
        property: property ? {
          id: property.id,
          title: property.title,
          image: property.main_image,
          host: property.host ? {
            id: property.host.id,
            name: `${property.host.first_name} ${property.host.last_name}`
          } : null
        } : null
      };
    });

    return NextResponse.json({
      reservations: formattedReservations,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching all reservations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}