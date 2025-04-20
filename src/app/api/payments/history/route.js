import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

/**
 * Get previous payments / installments for a user
 * - Returns all completed (paid) installments for the user
 * - Includes payment details, reservation, and property information
 * - Paginated and sorted by payment date (most recent first)
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
    const offset = (page - 1) * limit;

    // Get all paid installments for the user's reservations
    const { data: paidInstallments, error: installmentsError, count } = await supabase
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
          reservation_id,
          reservations(
            id,
            property_id,
            check_in_date,
            check_out_date,
            properties(
              id,
              title,
              main_image
            )
          )
        ),
        payments(
          id,
          amount,
          status,
          created_at,
          stripe_payment_intent_id
        )
      `, { count: 'exact' })
      .eq('status', 'paid')
      .filter('payment_plans.reservations.user_id', 'eq', user.id)
      .order('due_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (installmentsError) {
      return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
    }

    // Format response
    const formattedPayments = paidInstallments.map(installment => {
      const paymentPlan = installment.payment_plans;
      const reservation = paymentPlan?.reservations;
      const property = reservation?.properties;
      
      // Get the successful payment (there should be one for paid installments)
      const successfulPayment = installment.payments?.find(p => p.status === 'succeeded');
      
      return {
        installmentId: installment.id,
        amount: installment.amount,
        dueDate: installment.due_date,
        paidOn: successfulPayment?.created_at || installment.created_at,
        paymentPlanId: installment.payment_plan_id,
        paymentId: successfulPayment?.id,
        paymentIntentId: successfulPayment?.stripe_payment_intent_id,
        reservation: reservation ? {
          id: reservation.id,
          checkInDate: reservation.check_in_date,
          checkOutDate: reservation.check_out_date
        } : null,
        property: property ? {
          id: property.id,
          title: property.title,
          image: property.main_image
        } : null
      };
    });

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}