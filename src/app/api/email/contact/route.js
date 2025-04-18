import { NextResponse } from 'next/server'
import supabase from '@/app/services/supabase'
import resend from '@/app/services/resend'
import GeneralEmail from '@/app/components/emails/GeneralEmail'
import ListingEmail from '@/app/components/emails/ListingEmail'
import { isRateLimited } from '@/app/lib/utils'

// TODO: Change email target to the property owner if propertyid is provided

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
    "propertyid": "2" // Optional, if provided, will fetch property details for the email
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
      return new Response({ error: 'Too many requests'}, { status: 429 })
    }

    const { name, email, phone, message, propertyid } = await request.json()
    
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 })
    }
    
    let propertyDetails = null

    if (propertyid) {
      const { data: property, error: propertyError } = await supabase
        .from('properties').select(`title, main_image, price, price_description, locations(city, state, country)`)
        .eq('id', propertyid)
        .single()
      
      if (propertyError) {
        if (propertyError.code === 'PGRST116') {
          return NextResponse.json({ error: 'Property not found' }, { status: 404 })
        }
        return NextResponse.json({ error: `Property retrieval failed: ${propertyError.message}` }, { status: 500 })
      }

      propertyDetails = {
        id: propertyid,
        title: property.title,
        main_image_url: property.main_image,
        price: `${property.price} • ${property.price_description}`,
        location: `${property.locations.city}, ${property.locations.state}, ${property.locations.country}`
      }
    }

    const emailSubject = propertyDetails ?
    `New inquiry about ${propertyDetails.title}` :
    'New inquiry from your rental website'

    
    const { error: emailError } = await resend.emails.send({
      from: 'Cozy Soul Inc <noreply@scriptphi.com>',
      to: process.env.ADMIN_EMAIL,
      subject: emailSubject,
      react: propertyDetails ?
        ListingEmail({ name, email, phone, message, propertyDetails }) :
        GeneralEmail({ name, email, phone, message }),
    })
    

    if (emailError) {
      return NextResponse.json({ error: `Failed to send email: ${emailError.message}` }, { status: 500 })
    }
    
    return NextResponse.json({ status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}