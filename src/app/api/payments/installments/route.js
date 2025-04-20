import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

/**
 * Return all installments to be paid for a user
 * - Gets all pending/overdue installments for the authenticated user
 * - Includes reservation and property details
 * - Ordered by due date (soonest first)
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

    // Build query to get all pending installments for the user's reservations
    let query = supabase
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
          reservation_id,
          reservations(
            id,
            property_id,
            check_in_date,
            check_out_date,
            total_price,
            status,
            properties(
              id,
              title,
              main_image,
              host_id,
              host:host_id(
                id,
                first_name,
                last_name
              )
            )
          )
        ),
        payments(
          id,
          amount,
          status,
          created_at
        )
      `, { count: 'exact' })
      .filter('payment_plans.reservations.user_id', 'eq', user.id);
      
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    } else {
      // By default, show only pending and overdue installments
      query = query.in('status', ['pending', 'overdue']);
    }
    
    // Apply pagination and ordering
    const { data: installments, error: installmentsError, count } = await query
      .order('due_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (installmentsError) {
      return NextResponse.json({ error: 'Failed to fetch installments' }, { status: 500 });
    }
    
    // Format response
    const formattedInstallments = installments.map(installment => {
      const paymentPlan = installment.payment_plans;
      const reservation = paymentPlan?.reservations;
      const property = reservation?.properties;
      const lastPayment = installment.payments && installment.payments.length > 0 
        ? installment.payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] 
        : null;
        
      // Check if installment is overdue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(installment.due_date);
      const isOverdue = dueDate < today && installment.status === 'pending';
      
      // If status is pending but the due date has passed, mark as overdue
      if (isOverdue && installment.status === 'pending') {
        // Update status in database (but don't wait for it to complete)
        supabase
          .from('installments')
          .update({ status: 'overdue' })
          .eq('id', installment.id)
          .then(() => {
            console.log(`Marked installment ${installment.id} as overdue`);
          })
          .catch(error => {
            console.error(`Failed to mark installment as overdue: ${error.message}`);
          });
      }
      
      return {
        id: installment.id,
        amount: installment.amount,
        dueDate: installment.due_date,
        status: isOverdue ? 'overdue' : installment.status,
        createdAt: installment.created_at,
        paymentPlanId: installment.payment_plan_id,
        lastPaymentAttempt: lastPayment ? {
          id: lastPayment.id,
          status: lastPayment.status,
          amount: lastPayment.amount,
          date: lastPayment.created_at
        } : null,
        reservation: reservation ? {
          id: reservation.id,
          checkInDate: reservation.check_in_date,
          checkOutDate: reservation.check_out_date,
          totalPrice: reservation.total_price,
          status: reservation.status
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
      installments: formattedInstallments,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching installments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}