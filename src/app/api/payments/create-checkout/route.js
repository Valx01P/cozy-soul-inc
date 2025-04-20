import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { installmentId } = await request.json();
    
    if (!installmentId) {
      return NextResponse.json({ error: 'Installment ID is required' }, { status: 400 });
    }

    // Fetch the installment with related data
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
            property_id,
            properties(
              id,
              title,
              main_image,
              host_id,
              host:host_id(
                first_name,
                last_name
              )
            )
          )
        )
      `)
      .eq('id', installmentId)
      .single();

    if (installmentError) {
      if (installmentError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Installment not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch installment' }, { status: 500 });
    }

    // Verify this installment belongs to the user's reservation
    const reservation = installment.payment_plans?.reservations;
    if (!reservation || reservation.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to pay this installment' }, { status: 403 });
    }

    // Check if the installment is already paid
    if (installment.status === 'paid') {
      return NextResponse.json({ error: 'This installment has already been paid' }, { status: 400 });
    }

    // Extract property details for the checkout session
    const property = reservation.properties;
    const propertyTitle = property?.title || 'Property Rental';
    const propertyImage = property?.main_image;
    const hostName = property?.host 
      ? `${property.host.first_name} ${property.host.last_name}`
      : 'Property Owner';

    // Prepare the line item for the checkout
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Payment for ${propertyTitle}`,
            description: `Installment payment for reservation #${reservation.id}`,
            images: propertyImage ? [propertyImage] : undefined,
          },
          unit_amount: Math.round(installment.amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ];

    // Set the base URL for success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payments/installments/${installmentId}?canceled=true`,
      customer_email: user.email, // Pre-fill the email field
      metadata: {
        installmentId: installment.id,
        reservationId: reservation.id,
        userId: user.id
      },
      payment_intent_data: {
        metadata: {
          installmentId: installment.id,
          reservationId: reservation.id,
          userId: user.id
        }
      }
    });

    // Update installment status to 'processing'
    await supabase
      .from('installments')
      .update({ status: 'processing' })
      .eq('id', installmentId);

    return NextResponse.json({
      sessionId: session.id,
      checkoutUrl: session.url
    }, { status: 200 });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}