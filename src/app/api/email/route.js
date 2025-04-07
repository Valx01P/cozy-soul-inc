import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import supabase from '@/app/services/supabase'
import GeneralEmail from '@/app/components/emails/GeneralEmail'
import ListingEmail from '@/app/components/emails/ListingEmail'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)


const requestCounts = {}

// Function to check if the request rate exceeds the limit
function isRateLimited (ip) {
  const requestLimit = 3 // Limiting to 2 requests per 10 minutes
  const interval = 10 * 60 * 1000 // 10 minutes

  // Initialize request count if not already present
  requestCounts[ip] = requestCounts[ip] || []

  // Remove requests older than 1 minute
  requestCounts[ip] = requestCounts[ip].filter(({ timestamp }) => timestamp > Date.now() - interval)

  // Check if request count exceeds limit
  if (requestCounts[ip].length >= requestLimit) {
    return true // Rate limit exceeded
  }

  // Increment request count
  requestCounts[ip].push({ timestamp: Date.now() })
  return false // Rate limit not exceeded
}


export async function POST(request) {  
  try {

    // Get IP address of requester
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.headers.get('remote_addr') || request.connection.remoteAddress

    // Check if request is rate limited
    if (isRateLimited(ip)) {
      return new Response({ message: 'Too many requests'}, { status: 429 })
    }

    const { name, email, phone, message, propertyid } = await request.json()
    
    // Validate inputs
    if (!name || !email || !message) {
      return NextResponse.json({ message: 'Name, email and message are required' }, { status: 400 })
    }
    
    // Get property details if a propertyid was provided
    let propertyDetails = null

    // Check if a propertyid was provided or not, this helps to determine the email template to use
    // If a propertyid is provided, fetch the property details from the database
    // If not, use the general email template for contact form submissions
    if (propertyid) {
      const { data: property, error } = await supabase
        .from('properties').select(`title, main_image, price, price_description, locations(city, state, country)`)
        .eq('id', propertyid)
        .single()
      
      if (!error && property) {
        propertyDetails = {
          id: propertyid,
          title: property.title,
          main_image_url: property.main_image,
          price: `${property.price} • ${property.price_description}`,
          location: `${property.locations.city}, ${property.locations.state}, ${property.locations.country}`
        }
      }
    }

    const emailSubject = propertyDetails ?
    `New inquiry about ${propertyDetails.title}` :
    'New inquiry from your rental website'
    
    // Send the email
    const { data, error } = await resend.emails.send({
      from: 'Rental Website <noreply@scriptphi.com>',
      to: process.env.ADMIN_EMAIL,
      subject: emailSubject,
      react: propertyDetails ?
        ListingEmail({ name, email, phone, message, propertyDetails }) :
        GeneralEmail({ name, email, phone, message }),
    })
    
    if (error) {
      return NextResponse.json({ message: `Failed to send email ${error.message}` }, { status: 500 })
    }

    const response = {
      message: 'Email sent successfully',
      data: data
    }
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json(error.message, { status: 500 })
  }
}