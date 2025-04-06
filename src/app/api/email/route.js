import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import supabase from '@/app/services/supabase';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { name, email, phone, message, propertyId } = await request.json();
    
    // Validate inputs
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email and message are required' },
        { status: 400 }
      );
    }
    
    // Get property details if a propertyId was provided
    let propertyDetails = null;
    if (propertyId) {
      const { data: property, error } = await supabase
        .from('Properties')
        .select(`
          title,
          display_price,
          display_price_description,
          location_id,
          Locations(city, state, country)
        `)
        .eq('property_id', propertyId)
        .single();
      
      if (!error && property) {
        propertyDetails = {
          title: property.title,
          price: `${property.display_price} ${property.display_price_description}`,
          location: `${property.Locations.city}, ${property.Locations.state}, ${property.Locations.country}`
        };
      }
    }
    
    // Get admin email
    const adminEmail = process.env.ADMIN_EMAIL;
    
    // Construct email content
    let emailSubject = 'New inquiry from your rental website';
    if (propertyDetails) {
      emailSubject = `Inquiry about: ${propertyDetails.title}`;
    }
    
    let emailContent = `
      <h2>You have a new inquiry${propertyDetails ? ' about a property' : ''}!</h2>
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;
    
    if (propertyDetails) {
      emailContent += `
        <h3>Property Details:</h3>
        <p><strong>Title:</strong> ${propertyDetails.title}</p>
        <p><strong>Price:</strong> ${propertyDetails.price}</p>
        <p><strong>Location:</strong> ${propertyDetails.location}</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/listings/${propertyId}">View Property</a></p>
      `;
    }
    
    // Send the email
    const { data, error } = await resend.emails.send({
      from: 'Rental Website <noreply@yourdomain.com>',
      to: adminEmail,
      subject: emailSubject,
      html: emailContent,
      reply_to: email
    });
    
    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}