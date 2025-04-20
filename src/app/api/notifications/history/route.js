import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

/*
get all your previously read reservation notifications
*/
export async function GET(request) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL search params for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get read notifications for this user with pagination
    const { data: notifications, error: notifError, count } = await supabase
      .from('reservationnotifications')
      .select(`
        id,
        type,
        message,
        is_read,
        created_at,
        reservation_id,
        reservations(
          id,
          property_id,
          check_in_date,
          check_out_date,
          guests_count,
          total_price,
          status,
          properties(
            id,
            title,
            main_image
          )
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_read', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (notifError) {
      return NextResponse.json({ error: 'Failed to fetch notification history' }, { status: 500 });
    }
    
    // Format the response
    const formattedNotifications = notifications.map(notification => {
      const reservation = notification.reservations;
      return {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        isRead: notification.is_read,
        createdAt: notification.created_at,
        reservation: reservation ? {
          id: reservation.id,
          propertyId: reservation.property_id,
          checkInDate: reservation.check_in_date,
          checkOutDate: reservation.check_out_date,
          guestsCount: reservation.guests_count,
          totalPrice: reservation.total_price,
          status: reservation.status,
          property: reservation.properties ? {
            id: reservation.properties.id,
            title: reservation.properties.title,
            image: reservation.properties.main_image
          } : null
        } : null
      };
    });

    return NextResponse.json({
      notifications: formattedNotifications,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}