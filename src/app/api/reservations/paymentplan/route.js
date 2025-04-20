import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

/**
 * Create a payment plan for a reservation (ADMIN ONLY)
 */
export async function POST(request) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can create payment plans' }, { status: 403 });
    }

    // Get request body
    const { reservationId, notes, installments } = await request.json();
    
    if (!reservationId || !installments || !Array.isArray(installments) || installments.length === 0) {
      return NextResponse.json({ error: 'Reservation ID and at least one installment are required' }, { status: 400 });
    }
    
    // Validate installments
    for (const installment of installments) {
      if (!installment.amount || !installment.dueDate) {
        return NextResponse.json({ error: 'Each installment must have an amount and due date' }, { status: 400 });
      }
      
      if (isNaN(Number(installment.amount)) || Number(installment.amount) <= 0) {
        return NextResponse.json({ error: 'Installment amount must be a positive number' }, { status: 400 });
      }
      
      // Ensure due date is in the future
      const dueDate = new Date(installment.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        return NextResponse.json({ error: 'Due dates must be in the future' }, { status: 400 });
      }
    }

    // Check if reservation exists and is approved
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('id, status, total_price, user_id, property_id, properties(title)')
      .eq('id', reservationId)
      .single();
      
    if (reservationError) {
      if (reservationError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch reservation' }, { status: 500 });
    }
    
    if (reservation.status !== 'approved') {
      return NextResponse.json({ error: 'Cannot create payment plan for a reservation that is not approved' }, { status: 400 });
    }
    
    // Check if payment plan already exists
    const { data: existingPlan, error: planError } = await supabase
      .from('payment_plans')
      .select('id')
      .eq('reservation_id', reservationId);
      
    if (planError) {
      return NextResponse.json({ error: 'Failed to check existing payment plan' }, { status: 500 });
    }
    
    if (existingPlan && existingPlan.length > 0) {
      return NextResponse.json({ error: 'A payment plan already exists for this reservation' }, { status: 400 });
    }
    
    // Calculate total installment amount
    const totalInstallmentAmount = installments.reduce((sum, inst) => sum + Number(inst.amount), 0);
    
    // Ensure total matches reservation price
    if (Math.abs(totalInstallmentAmount - reservation.total_price) > 0.01) { // Allow small rounding differences
      return NextResponse.json({ 
        error: `Total installment amount (${totalInstallmentAmount}) must match reservation price (${reservation.total_price})` 
      }, { status: 400 });
    }
    
    // Start a transaction to create payment plan and installments
    const { data: paymentPlan, error: createPlanError } = await supabase
      .from('payment_plans')
      .insert({
        reservation_id: reservationId,
        created_by: user.id,
        notes: notes || null
      })
      .select()
      .single();
      
    if (createPlanError) {
      return NextResponse.json({ error: 'Failed to create payment plan' }, { status: 500 });
    }
    
    // Create installments
    const installmentRecords = installments.map(installment => ({
      payment_plan_id: paymentPlan.id,
      amount: Number(installment.amount),
      due_date: installment.dueDate,
      status: 'pending'
    }));
    
    const { data: createdInstallments, error: installmentError } = await supabase
      .from('installments')
      .insert(installmentRecords)
      .select();
      
    if (installmentError) {
      // If installments creation fails, we should ideally roll back the payment plan creation
      // But since we don't have full transaction support, we'll try to delete the payment plan
      await supabase
        .from('payment_plans')
        .delete()
        .eq('id', paymentPlan.id);
        
      return NextResponse.json({ error: 'Failed to create installments' }, { status: 500 });
    }
    
    // Create a notification for the guest
    await supabase
      .from('reservationnotifications')
      .insert({
        user_id: reservation.user_id,
        reservation_id: reservationId,
        type: 'payment_plan_created',
        message: `A payment plan has been created for your reservation of "${reservation.properties.title}"`
      });
    
    return NextResponse.json({
      id: paymentPlan.id,
      reservationId: paymentPlan.reservation_id,
      notes: paymentPlan.notes,
      createdBy: user.id,
      createdAt: paymentPlan.created_at,
      installments: createdInstallments.map(inst => ({
        id: inst.id,
        amount: inst.amount,
        dueDate: inst.due_date,
        status: inst.status
      })),
      totalAmount: totalInstallmentAmount
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Get all payment plans (ADMIN ONLY)
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
      return NextResponse.json({ error: 'Forbidden: Only admins can view all payment plans' }, { status: 403 });
    }

    // Get URL search params for pagination and filters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const reservationId = url.searchParams.get('reservationId');
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('payment_plans')
      .select(`
        id,
        reservation_id,
        notes,
        created_at,
        created_by,
        creator:created_by(
          id,
          first_name,
          last_name
        ),
        reservations!reservation_id(
          id,
          property_id,
          user_id,
          check_in_date,
          check_out_date,
          total_price,
          status,
          properties(
            id,
            title
          ),
          users(
            id,
            first_name,
            last_name,
            email
          )
        ),
        installments(
          id,
          amount,
          due_date,
          status
        )
      `, { count: 'exact' });
    
    // Apply reservation filter if provided
    if (reservationId) {
      query = query.eq('reservation_id', reservationId);
    }
    
    // Apply pagination and ordering
    const { data: paymentPlans, error: plansError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (plansError) {
      return NextResponse.json({ error: 'Failed to fetch payment plans' }, { status: 500 });
    }
    
    // Format the response
    const formattedPlans = paymentPlans.map(plan => {
      const reservation = plan.reservations;
      const installments = plan.installments || [];
      
      // Calculate payment statistics
      const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
      const paidAmount = installments
        .filter(inst => inst.status === 'paid')
        .reduce((sum, inst) => sum + inst.amount, 0);
      const pendingAmount = totalAmount - paidAmount;
      const paidPercentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
      
      return {
        id: plan.id,
        reservationId: plan.reservation_id,
        notes: plan.notes,
        createdAt: plan.created_at,
        creator: plan.creator ? {
          id: plan.creator.id,
          name: `${plan.creator.first_name} ${plan.creator.last_name}`
        } : null,
        reservation: reservation ? {
          id: reservation.id,
          checkInDate: reservation.check_in_date,
          checkOutDate: reservation.check_out_date,
          totalPrice: reservation.total_price,
          status: reservation.status,
          property: reservation.properties ? {
            id: reservation.properties.id,
            title: reservation.properties.title
          } : null,
          guest: reservation.users ? {
            id: reservation.users.id,
            name: `${reservation.users.first_name} ${reservation.users.last_name}`,
            email: reservation.users.email
          } : null
        } : null,
        installments: installments.map(inst => ({
          id: inst.id,
          amount: inst.amount,
          dueDate: inst.due_date,
          status: inst.status
        })),
        stats: {
          totalAmount,
          paidAmount,
          pendingAmount,
          paidPercentage,
          installmentCount: installments.length,
          paidInstallmentCount: installments.filter(inst => inst.status === 'paid').length
        }
      };
    });

    return NextResponse.json({
      paymentPlans: formattedPlans,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching payment plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}