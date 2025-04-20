import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

/**
 * Returns all reservations for the current user
 * Requires valid access token
 */
export async function GET(request) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL search params for pagination and filters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status'); // Filter by status if provided
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
        properties(
          id,
          title,
          main_image,
          host_id,
          host:host_id(
            id,
            first_name,
            last_name,
            profile_image
          )
        ),
        payment_plans(
          id,
          notes,
          installments(
            id,
            amount,
            due_date,
            status
          )
        )
      `, { count: 'exact' })
      .eq('user_id', user.id);
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply pagination and ordering
    const { data: reservations, error: reservationsError, count } = await query
      .order('check_in_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (reservationsError) {
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
    }
    
    // Format the response
    const formattedReservations = reservations.map(reservation => {
      const property = reservation.properties;
      const paymentPlan = reservation.payment_plans && reservation.payment_plans.length > 0 ? 
        reservation.payment_plans[0] : null;
      
      return {
        id: reservation.id,
        propertyId: reservation.property_id,
        checkInDate: reservation.check_in_date,
        checkOutDate: reservation.check_out_date,
        guestsCount: reservation.guests_count,
        totalPrice: reservation.total_price,
        status: reservation.status,
        createdAt: reservation.created_at,
        property: property ? {
          id: property.id,
          title: property.title,
          image: property.main_image,
          host: property.host ? {
            id: property.host.id,
            name: `${property.host.first_name} ${property.host.last_name}`,
            profileImage: property.host.profile_image
          } : null
        } : null,
        paymentPlan: paymentPlan ? {
          id: paymentPlan.id,
          notes: paymentPlan.notes,
          installments: paymentPlan.installments ? paymentPlan.installments.map(inst => ({
            id: inst.id,
            amount: inst.amount,
            dueDate: inst.due_date,
            status: inst.status
          })) : []
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
    console.error('Error fetching user reservations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}