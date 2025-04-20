import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Verify a payment's status using the checkout session ID
 * This is used after a user is redirected back from a successful Stripe checkout
 */
export async function GET(request) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session ID from query params
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    // Make sure the session exists and is complete
    if (!session || session.status !== 'complete') {
      return NextResponse.json({ 
        status: 'incomplete',
        message: 'Payment is not complete yet'
      }, { status: 200 });
    }

    // Get the installment ID from metadata
    const installmentId = session.metadata?.installmentId;
    if (!installmentId) {
      return NextResponse.json({ error: 'No installment ID found in session metadata' }, { status: 400 });
    }

    // Check if this payment has already been recorded
    const { data: existingPayment, error: paymentQueryError } = await supabase
      .from('payments')
      .select('id, status')
      .eq('stripe_checkout_session_id', sessionId)
      .maybeSingle();

    if (paymentQueryError) {
      console.error('Error checking existing payment:', paymentQueryError);
    }

    // If we already have a recorded payment, return its details
    if (existingPayment) {
      // Fetch the installment details for the response
      const { data: installment, error: installmentError } = await supabase
        .from('installments')
        .select(`
          id,
          amount,
          status,
          payment_plan_id,
          payment_plans(
            reservation_id,
            reservations(
              id,
              properties(
                title
              )
            )
          )
        `)
        .eq('id', installmentId)
        .single();

      if (installmentError) {
        return NextResponse.json({ error: 'Failed to fetch installment details' }, { status: 500 });
      }

      const propertyTitle = installment.payment_plans?.reservations?.properties?.title || 'Property Rental';
      const reservationId = installment.payment_plans?.reservation_id;

      return NextResponse.json({
        status: 'processed',
        paymentId: existingPayment.id,
        paymentStatus: existingPayment.status,
        installmentId,
        reservationId,
        property: propertyTitle,
        amount: session.amount_total / 100 // Convert from cents to dollars
      }, { status: 200 });
    }

    // If no existing payment record, this is likely the first verification after redirect
    // The webhook might not have processed it yet, so we'll check and create a record if needed

    // First, check that the payment_intent is actually successful
    const paymentIntent = session.payment_intent;
    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      return NextResponse.json({
        status: 'incomplete',
        message: 'Payment intent is not successful yet'
      }, { status: 200 });
    }

    // Verify the installment belongs to the user
    const { data: installment, error: installmentError } = await supabase
      .from('installments')
      .select(`
        id,
        amount,
        status,
        payment_plan_id,
        payment_plans(
          reservation_id,
          reservations(
            id,
            user_id,
            properties(
              title
            )
          )
        )
      `)
      .eq('id', installmentId)
      .single();

    if (installmentError) {
      return NextResponse.json({ error: 'Failed to fetch installment' }, { status: 500 });
    }

    const reservation = installment.payment_plans?.reservations;
    if (!reservation || reservation.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Invalid installment for this user' }, { status: 403 });
    }

    // Create a payment record if webhook hasn't done so already
    // (this is a safety measure; normally the webhook should handle this)
    const { data: newPayment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        installment_id: installmentId,
        amount: session.amount_total / 100, // Convert from cents to dollars
        stripe_payment_intent_id: typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id,
        stripe_checkout_session_id: session.id,
        status: 'succeeded'
      })
      .select()
      .single();

    if (paymentError) {
      // If there's an error creating the payment record, it might be a duplicate
      // from the webhook already processing it, which is fine
      console.error('Error creating payment record:', paymentError);
    }

    // Update the installment status to paid if it's not already
    if (installment.status !== 'paid') {
      await supabase
        .from('installments')
        .update({ status: 'paid' })
        .eq('id', installmentId);
    }

    // Return success response
    const propertyTitle = reservation.properties?.title || 'Property Rental';
    const reservationId = installment.payment_plans?.reservation_id;

    return NextResponse.json({
      status: 'success',
      paymentId: newPayment?.id,
      sessionId: session.id,
      installmentId,
      reservationId,
      property: propertyTitle,
      amount: session.amount_total / 100, // Convert from cents to dollars
      message: 'Payment verified successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}