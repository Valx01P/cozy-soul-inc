import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

/**
 * Get Installment by ID
 * - Includes detailed information about the installment
 * - Includes payment history for the installment
 * - Checks user authorization (must be admin, property owner, or reservation owner)
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Installment ID is required' }, { status: 400 });
    }

    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the installment with related data
    const { data: installment, error: installmentError } = await supabase
      .from('installments')
      .select(`
        id,
        payment_plan_id,
        amount,
        due_date,
        status,
        created_at,
        payment_plans(
          id,
          notes,
          created_by,
          created_at,
          reservation_id,
          creator:created_by(
            id,
            first_name,
            last_name,
            role
          ),
          reservations(
            id,
            property_id,
            user_id,
            check_in_date,
            check_out_date,
            total_price,
            status,
            properties(
              id,
              title,
              main_image,
              host_id
            ),
            users(
              id,
              first_name,
              last_name,
              email,
              profile_image
            )
          )
        ),
        payments(
          id,
          amount,
          status,
          stripe_payment_intent_id,
          stripe_checkout_session_id,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (installmentError) {
      if (installmentError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Installment not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch installment' }, { status: 500 });
    }

    // Check if user has access to this installment
    const paymentPlan = installment.payment_plans;
    const reservation = paymentPlan?.reservations;
    
    if (!reservation) {
      return NextResponse.json({ error: 'Reservation data not found' }, { status: 404 });
    }

    const isAdmin = user.role === 'admin';
    const isGuestUser = user.id === reservation.user_id;
    const isPropertyOwner = user.id === reservation.properties.host_id;

    if (!isAdmin && !isGuestUser && !isPropertyOwner) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this installment' }, { status: 403 });
    }

    // Format the response
    const property = reservation.properties;
    const guest = reservation.users;
    const creator = paymentPlan.creator;
    const payments = installment.payments || [];

    // Calculate payment details
    const paymentAttempts = payments.length;
    const successfulPayments = payments.filter(p => p.status === 'succeeded').length;
    const lastPayment = payments.length > 0 
      ? payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      : null;

    // Check if installment is overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(installment.due_date);
    const isOverdue = dueDate < today && installment.status === 'pending';
    
    // Format the payments
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      paymentIntentId: payment.stripe_payment_intent_id,
      checkoutSessionId: payment.stripe_checkout_session_id,
      createdAt: payment.created_at
    }));

    const response = {
      id: installment.id,
      amount: installment.amount,
      dueDate: installment.due_date,
      status: isOverdue ? 'overdue' : installment.status,
      createdAt: installment.created_at,
      paymentPlan: {
        id: paymentPlan.id,
        notes: paymentPlan.notes,
        createdAt: paymentPlan.created_at,
        creator: creator ? {
          id: creator.id,
          name: `${creator.first_name} ${creator.last_name}`,
          role: creator.role
        } : null
      },
      reservation: {
        id: reservation.id,
        checkInDate: reservation.check_in_date,
        checkOutDate: reservation.check_out_date,
        totalPrice: reservation.total_price,
        status: reservation.status
      },
      property: {
        id: property.id,
        title: property.title,
        image: property.main_image,
        hostId: property.host_id
      },
      guest: {
        id: guest.id,
        name: `${guest.first_name} ${guest.last_name}`,
        email: guest.email,
        profileImage: guest.profile_image
      },
      payments: formattedPayments,
      paymentSummary: {
        attempts: paymentAttempts,
        successful: successfulPayments,
        lastAttempt: lastPayment ? {
          id: lastPayment.id,
          status: lastPayment.status,
          date: lastPayment.created_at
        } : null
      }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching installment details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}