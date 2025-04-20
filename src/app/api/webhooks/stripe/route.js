import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import supabase from '@/app/services/supabase';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    // Verify webhook signature 
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        // For other event types, just log them
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(`Webhook error: ${error.message}`);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/**
 * Handle checkout.session.completed event
 * This is triggered when a customer successfully completes the checkout process
 */
async function handleCheckoutCompleted(session) {
  try {
    // Extract the installment ID from the metadata
    const installmentId = session.metadata?.installmentId;
    if (!installmentId) {
      console.error('No installment ID found in session metadata');
      return;
    }

    // Create a payment record in the database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        installment_id: installmentId,
        amount: session.amount_total / 100, // Convert from cents to dollars
        stripe_payment_intent_id: session.payment_intent,
        stripe_checkout_session_id: session.id,
        status: 'succeeded'
      })
      .select()
      .single();

    if (paymentError) {
      console.error(`Failed to create payment record: ${paymentError.message}`);
      return;
    }

    // Update the installment status
    const { data: installment, error: installmentError } = await supabase
      .from('installments')
      .update({ status: 'paid' })
      .eq('id', installmentId)
      .select('payment_plan_id, amount')
      .single();

    if (installmentError) {
      console.error(`Failed to update installment status: ${installmentError.message}`);
      return;
    }

    // Get reservation and user details for notification
    const { data: paymentPlan, error: planError } = await supabase
      .from('payment_plans')
      .select(`
        id,
        reservation_id,
        reservations(
          id,
          user_id,
          property_id,
          properties(title)
        )
      `)
      .eq('id', installment.payment_plan_id)
      .single();

    if (planError) {
      console.error(`Failed to fetch payment plan details: ${planError.message}`);
      return;
    }

    const reservation = paymentPlan.reservations;
    const userId = reservation.user_id;
    const reservationId = reservation.id;
    const propertyTitle = reservation.properties.title;

    // Create a notification for the payment
    await supabase
      .from('reservationnotifications')
      .insert({
        user_id: userId,
        reservation_id: reservationId,
        type: 'payment_success',
        message: `Your payment of $${installment.amount.toFixed(2)} for "${propertyTitle}" was successful.`
      });

    // Also create a notification for the admin/property owner
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('host_id')
      .eq('id', reservation.property_id)
      .single();

    if (!propertyError && property) {
      await supabase
        .from('reservationnotifications')
        .insert({
          user_id: property.host_id,
          reservation_id: reservationId,
          type: 'payment_received',
          message: `A payment of $${installment.amount.toFixed(2)} was received for "${propertyTitle}".`
        });
    }

    console.log(`Successfully processed payment for installment ${installmentId}`);
  } catch (error) {
    console.error(`Error handling checkout.session.completed: ${error.message}`);
  }
}

/**
 * Handle payment_intent.succeeded event
 * This can be used as a backup to ensure payment is recorded
 */
async function handlePaymentSucceeded(paymentIntent) {
  try {
    // Check if we already have a payment record for this payment intent
    const { data: existingPayment, error: queryError } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .maybeSingle();

    if (queryError) {
      console.error(`Failed to query existing payment: ${queryError.message}`);
      return;
    }

    // If we already have a record, no need to process further
    if (existingPayment) {
      console.log(`Payment for intent ${paymentIntent.id} already processed`);
      return;
    }

    // If not processed via checkout.session.completed, try to find installment from metadata
    const installmentId = paymentIntent.metadata?.installmentId;
    if (!installmentId) {
      console.error('No installment ID found in payment intent metadata');
      return;
    }

    // Create payment record and update installment (simplified version of the above)
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        installment_id: installmentId,
        amount: paymentIntent.amount / 100, // Convert from cents to dollars
        stripe_payment_intent_id: paymentIntent.id,
        status: 'succeeded'
      });

    if (paymentError) {
      console.error(`Failed to create payment record: ${paymentError.message}`);
      return;
    }

    // Update installment status
    const { error: installmentError } = await supabase
      .from('installments')
      .update({ status: 'paid' })
      .eq('id', installmentId);

    if (installmentError) {
      console.error(`Failed to update installment status: ${installmentError.message}`);
      return;
    }

    console.log(`Successfully processed payment intent for installment ${installmentId}`);
  } catch (error) {
    console.error(`Error handling payment_intent.succeeded: ${error.message}`);
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentFailed(paymentIntent) {
  try {
    // Get installment ID from metadata
    const installmentId = paymentIntent.metadata?.installmentId;
    if (!installmentId) {
      console.error('No installment ID found in payment intent metadata');
      return;
    }

    // Create a failed payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        installment_id: installmentId,
        amount: paymentIntent.amount / 100, // Convert from cents to dollars
        stripe_payment_intent_id: paymentIntent.id,
        status: 'failed'
      })
      .select()
      .single();

    if (paymentError) {
      console.error(`Failed to create payment record: ${paymentError.message}`);
      return;
    }

    // Update installment status to 'failed' if it's not already paid
    const { data: installment, error: installmentError } = await supabase
      .from('installments')
      .select('status, payment_plan_id')
      .eq('id', installmentId)
      .single();

    if (installmentError) {
      console.error(`Failed to fetch installment: ${installmentError.message}`);
      return;
    }

    // Only update status if not already paid
    if (installment.status !== 'paid') {
      const { error: updateError } = await supabase
        .from('installments')
        .update({ status: 'failed' })
        .eq('id', installmentId);

      if (updateError) {
        console.error(`Failed to update installment status: ${updateError.message}`);
        return;
      }
    }

    // Get reservation and user details for notification
    const { data: paymentPlan, error: planError } = await supabase
      .from('payment_plans')
      .select(`
        id,
        reservation_id,
        reservations(
          id,
          user_id,
          properties(title)
        )
      `)
      .eq('id', installment.payment_plan_id)
      .single();

    if (planError) {
      console.error(`Failed to fetch payment plan details: ${planError.message}`);
      return;
    }

    const reservation = paymentPlan.reservations;
    const userId = reservation.user_id;

    // Create a notification for the failed payment
    await supabase
      .from('reservationnotifications')
      .insert({
        user_id: userId,
        reservation_id: reservation.id,
        type: 'payment_failed',
        message: `Your payment for "${reservation.properties.title}" failed. Please try again or contact support.`
      });

    console.log(`Processed failed payment for installment ${installmentId}`);
  } catch (error) {
    console.error(`Error handling payment_intent.payment_failed: ${error.message}`);
  }
}