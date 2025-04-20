import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

/*
get all your unread reservation notifications
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
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get unread notifications for this user with pagination
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
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (notifError) {
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
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
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH route to mark notifications as read
export async function PATCH(request) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds } = await request.json();
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'Notification IDs are required' }, { status: 400 });
    }
    
    // Check if notifications belong to user
    const { data: userNotifications, error: checkError } = await supabase
      .from('reservationnotifications')
      .select('id')
      .eq('user_id', user.id)
      .in('id', notificationIds);
      
    if (checkError) {
      return NextResponse.json({ error: 'Failed to verify notifications' }, { status: 500 });
    }
    
    // Get IDs that actually belong to the user
    const validIds = userNotifications.map(n => n.id);
    
    if (validIds.length === 0) {
      return NextResponse.json({ error: 'No valid notification IDs provided' }, { status: 400 });
    }
    
    // Mark notifications as read
    const { data: updated, error: updateError } = await supabase
      .from('reservationnotifications')
      .update({ is_read: true })
      .in('id', validIds)
      .select();
      
    if (updateError) {
      return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: `${updated.length} notifications marked as read`,
      updatedIds: updated.map(n => n.id)
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}