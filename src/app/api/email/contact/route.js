// src/app/api/email/contact/route.js
import { NextResponse } from 'next/server'
import supabase from '@/app/services/supabase'
import resend from '@/app/services/resend'
import GeneralEmail from '@/app/components/emails/GeneralEmail'
import ListingEmail from '@/app/components/emails/ListingEmail'
import { isRateLimited } from '@/app/lib/utils'

/*
  @description
  Handles contact form submissions from the website.
  This is typically used to send inquiries about properties or general messages to the website admin.

  @requires
  {
    "name": "John Doe",
    "email": "example@gmail.com",
    "phone": "1234567890",
    "message": "Hello, I am interested in this property.",
    "property_info": {      // Changed from propertyid to property_info
      "id": "2",
      "title": "Property Title",
      "main_image": "image_url",
      "location": "City, State, Country"
    }
  }

  @returns
  SENDS EMAIL TO THE WEBSITE ADMIN OR PROPERTY OWNER

  @throws
  {
    "error": "Some error message"
  }
*/
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.headers.get('remote_addr') || request.connection.remoteAddress

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests'}, { status: 429 })
    }

    // Parse the request body
    const requestData = await request.json()
    const { name, email, phone, message, propertyid, property_info } = requestData
    
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 })
    }
    
    let propertyDetails = null

    // Check if we have property_info (new method) or propertyid (old method)
    if (property_info) {
      // Use the provided property_info directly
      propertyDetails = {
        id: property_info.id,
        title: property_info.title,
        main_image_url: property_info.main_image,
        location: property_info.location
      }
    } else if (propertyid) {
      // Legacy support for propertyid - fetch from database
      try {
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select(`
            id, 
            title, 
            main_image,
            locations(city, state, country)
          `)
          .eq('id', propertyid)
          .single()
        
        if (propertyError) {
          if (propertyError.code === 'PGRST116') {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 })
          }
          throw new Error(`Property retrieval failed: ${propertyError.message}`)
        }

        // Format the property details without depending on price or price_description
        propertyDetails = {
          id: propertyid,
          title: property.title,
          main_image_url: property.main_image,
          location: `${property.locations.city}, ${property.locations.state}, ${property.locations.country}`
        }
      } catch (err) {
        console.error("Error fetching property:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }

    // If we don't have property details, it's a general inquiry
    const emailSubject = propertyDetails
      ? `New inquiry about ${propertyDetails.title}`
      : 'New inquiry from your rental website'
    
    const { error: emailError } = await resend.emails.send({
      from: 'Cozy Soul Inc <noreply@scriptphi.com>',
      to: process.env.ADMIN_EMAIL,
      subject: emailSubject,
      react: propertyDetails
        ? ListingEmail({ name, email, phone, message, propertyDetails })
        : GeneralEmail({ name, email, phone, message }),
    })
    
    if (emailError) {
      console.error("Email sending error:", emailError)
      return NextResponse.json({ error: `Failed to send email: ${emailError.message}` }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: 'Email sent successfully' }, { status: 200 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}