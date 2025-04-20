import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

/**
 * View a reservation by ID (ONLY ADMIN, PROPERTY OWNER, OR RESERVATION OWNER)
 * Will be useful for dedicated reservation page that lists installments and payments as well
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the reservation with related data
    const { data: reservation, error: reservationError } = await supabase
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
          profile_image,
          email_verified,
          identity_verified
        ),
        properties!property_id(
          id,
          title,
          description,
          main_image,
          host_id,
          host:host_id(
            id,
            first_name,
            last_name,
            email,
            profile_image
          )
        ),
        payment_plans(
          id,
          notes,
          created_at,
          created_by,
          creator:created_by(
            id,
            first_name,
            last_name
          ),
          installments(
            id,
            amount,
            due_date,
            status,
            created_at,
            payments(
              id,
              amount,
              status,
              created_at
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (reservationError) {
      if (reservationError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch reservation' }, { status: 500 });
    }

    // Check if user has access to this reservation
    const isAdmin = user.role === 'admin';
    const isGuestUser = user.id === reservation.user_id;
    const isPropertyOwner = user.id === reservation.properties.host_id;

    if (!isAdmin && !isGuestUser && !isPropertyOwner) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this reservation' }, { status: 403 });
    }

    // Format the response
    const guest = reservation.users;
    const property = reservation.properties;
    const paymentPlan = reservation.payment_plans && reservation.payment_plans.length > 0 ? 
      reservation.payment_plans[0] : null;

    // Calculate payment statistics if payment plan exists
    let paymentStats = null;
    if (paymentPlan && paymentPlan.installments) {
      const totalAmount = paymentPlan.installments.reduce((sum, inst) => sum + inst.amount, 0);
      const paidAmount = paymentPlan.installments
        .filter(inst => inst.status === 'paid')
        .reduce((sum, inst) => sum + inst.amount, 0);
      const pendingAmount = totalAmount - paidAmount;
      const paidPercentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
      
      paymentStats = {
        totalAmount,
        paidAmount,
        pendingAmount,
        paidPercentage,
        installmentCount: paymentPlan.installments.length,
        paidInstallmentCount: paymentPlan.installments.filter(inst => inst.status === 'paid').length
      };
    }

    const response = {
      id: reservation.id,
      propertyId: reservation.property_id,
      userId: reservation.user_id,
      checkInDate: reservation.check_in_date,
      checkOutDate: reservation.check_out_date,
      guestsCount: reservation.guests_count,
      totalPrice: reservation.total_price,
      status: reservation.status,
      createdAt: reservation.created_at,
      guest: guest ? {
        id: guest.id,
        name: `${guest.first_name} ${guest.last_name}`,
        email: guest.email,
        profileImage: guest.profile_image,
        emailVerified: guest.email_verified,
        identityVerified: guest.identity_verified
      } : null,
      property: property ? {
        id: property.id,
        title: property.title,
        description: property.description,
        image: property.main_image,
        host: property.host ? {
          id: property.host.id,
          name: `${property.host.first_name} ${property.host.last_name}`,
          email: property.host.email,
          profileImage: property.host.profile_image
        } : null
      } : null,
      paymentPlan: paymentPlan ? {
        id: paymentPlan.id,
        notes: paymentPlan.notes,
        createdAt: paymentPlan.created_at,
        creator: paymentPlan.creator ? {
          id: paymentPlan.creator.id,
          name: `${paymentPlan.creator.first_name} ${paymentPlan.creator.last_name}`
        } : null,
        installments: paymentPlan.installments ? paymentPlan.installments.map(inst => ({
          id: inst.id,
          amount: inst.amount,
          dueDate: inst.due_date,
          status: inst.status,
          createdAt: inst.created_at,
          payments: inst.payments ? inst.payments.map(payment => ({
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            createdAt: payment.created_at
          })) : []
        })) : [],
        stats: paymentStats
      } : null
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching reservation details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Update reservation status (ONLY ADMIN OR PROPERTY OWNER)
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the request body
    const { status } = await request.json();
    
    if (!status || typeof status !== 'string') {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    
    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    // Fetch the reservation to check permissions
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('id, user_id, property_id, status, properties(host_id)')
      .eq('id', id)
      .single();

    if (reservationError) {
      if (reservationError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch reservation' }, { status: 500 });
    }

    // Check if user has permission
    const isAdmin = user.role === 'admin';
    const isPropertyOwner = user.id === reservation.properties.host_id;
    
    if (!isAdmin && !isPropertyOwner) {
      return NextResponse.json({ error: 'Forbidden: Only admins or property owners can update reservation status' }, { status: 403 });
    }
    
    // Some status changes should be restricted
    if (reservation.status === 'cancelled' || reservation.status === 'completed') {
      return NextResponse.json({ error: 'Cannot update a cancelled or completed reservation' }, { status: 400 });
    }
    
    // Only admin can set to completed
    if (status === 'completed' && !isAdmin) {
      return NextResponse.json({ error: 'Only admins can mark a reservation as completed' }, { status: 403 });
    }
    
    // Update the reservation status
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
      
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update reservation status' }, { status: 500 });
    }
    
    // Create a notification for the guest
    let notificationType = '';
    let notificationMessage = '';
    
    switch (status) {
      case 'approved':
        notificationType = 'reservation_approved';
        notificationMessage = 'Your reservation has been approved!';
        break;
      case 'rejected':
        notificationType = 'reservation_rejected';
        notificationMessage = 'Your reservation has been rejected.';
        break;
      case 'cancelled':
        notificationType = 'reservation_cancelled';
        notificationMessage = 'Your reservation has been cancelled.';
        break;
      case 'completed':
        notificationType = 'reservation_completed';
        notificationMessage = 'Your reservation has been marked as completed.';
        break;
      default:
        // No notification for other status changes
        break;
    }
    
    if (notificationType) {
      await supabase
        .from('reservationnotifications')
        .insert({
          user_id: reservation.user_id,
          reservation_id: id,
          type: notificationType,
          message: notificationMessage
        });
    }
    
    return NextResponse.json({
      id: updatedReservation.id,
      status: updatedReservation.status,
      message: `Reservation status updated to ${status}`
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Delete a reservation by ID (ONLY ADMINS)
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can delete reservations' }, { status: 403 });
    }

    // Fetch the reservation to make sure it exists
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('id, user_id, property_id, status')
      .eq('id', id)
      .single();

    if (reservationError) {
      if (reservationError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch reservation' }, { status: 500 });
    }
    
    // Delete the reservation
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete reservation' }, { status: 500 });
    }
    
    // Create a notification for the user
    await supabase
      .from('reservationnotifications')
      .insert({
        user_id: reservation.user_id,
        reservation_id: null, // No reservation ID since it's deleted
        type: 'reservation_deleted',
        message: 'Your reservation has been deleted by an administrator.'
      });
    
    return NextResponse.json({
      message: 'Reservation deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}