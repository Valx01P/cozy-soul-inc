import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
import supabase from '@/app/services/supabase'

/*
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE, -- Required for OAuth users, null for others
  password TEXT, -- Required for password-based auth
  email_verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(50) NOT NULL DEFAULT 'guest', -- 'guest', 'admin'
  identity_verified BOOLEAN DEFAULT FALSE,
  profile_image VARCHAR(255) DEFAULT 'https://placehold.co/1024x1024/png?text=User',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for properties (listings)
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  host_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  main_image VARCHAR(255),
  side_image1 VARCHAR(255),
  side_image2 VARCHAR(255),
  minimum_stay INTEGER NOT NULL DEFAULT 1,
  location_id INTEGER NOT NULL,
  number_of_guests INTEGER NOT NULL DEFAULT 1,
  number_of_bedrooms INTEGER NOT NULL DEFAULT 1,
  number_of_beds INTEGER NOT NULL DEFAULT 1,
  number_of_bathrooms INTEGER NOT NULL DEFAULT 1,
  additional_info TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- Table for property availability (calendars)
CREATE TABLE propertyavailability (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  price DECIMAL(10, 2) NOT NULL,
  availability_type VARCHAR(50) NOT NULL DEFAULT 'default', -- 'default', 'booked', 'blocked'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);


CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests_count INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
*/


/*
gets all your reservations for a listing
*/
export async function GET(request, { params }) {
  try {

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    const { accessToken } = await getAuthTokens(request)

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(accessToken)

    /**
     * @example Payload:
     * {
     *   "user_id": "123",
     *   "first_name": "John",
     *   "last_name": "Doe",
     *   "email": "user@example.com",
     *   "role": "guest",
     *   "email_verified": false,
     *   "identity_verified": false
     * }
     */
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('*')
      .eq('property_id', id)
      .eq('user_id', payload.user_id)
      .order('check_in_date', { ascending: true })

    if (reservationsError) {
      if (reservationsError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Reservations not found' }, { status: 404 })
      }
      return NextResponse.json({ error: `Reservations retrieval failed: ${reservationsError.message}` }, { status: 500 })
    }

    const response = [
      ...reservations.map(reservation => ({
        id: reservation.id,
        property_id: reservation.property_id,
        user_id: reservation.user_id,
        check_in_date: reservation.check_in_date,
        check_out_date: reservation.check_out_date,
        guests_count: reservation.guests_count,
        total_price: reservation.total_price,
        status: reservation.status,
        created_at: reservation.created_at,
      }))
    ]  

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



/*
lets you create a new reservation for a listing
example body:
{
  "check_in_date": "2023-10-01",
  "check_out_date": "2023-10-05",
  "guests_count": 2,
  "total_price": 500.00
}
ensure the total stayed days is greater than or equal to the minimum stay
ensure check in and check out date exist in the availability ranges
ensure the check in and check out date are not in the past
ensure the check in and check out date are not the same
ensure the check in date is before the check out date
ensure the guests count is greater than 0
ensure the total price is greater than 0
ensure the user has a verified email
ensure the listing is active
ensure the listing exists
ensure the user exists

creates a notification for the host of the listing

*/
export async function POST(request, { params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    const { accessToken } = await getAuthTokens(request)

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(accessToken)

    /**
     * @example Payload:
     * {
     *   "user_id": "123",
     *   "first_name": "John",
     *   "last_name": "Doe",
     *   "email": "user@example.com",
     *   "role": "guest",
     *   "email_verified": false,
     *   "identity_verified": false
     * }
     */
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user has verified email
    if (!payload.email_verified) {
      return NextResponse.json({ error: 'Email verification is required to make reservations' }, { status: 403 })
    }

    const body = await request.json()

    const { check_in_date, check_out_date, guests_count, total_price } = body

    if (!check_in_date || !check_out_date || !guests_count || !total_price) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (guests_count <= 0) {
      return NextResponse.json({ error: 'Guests count must be greater than 0' }, { status: 400 })
    }
    if (total_price <= 0) {
      return NextResponse.json({ error: 'Total price must be greater than 0' }, { status: 400 })
    }

    // Check if the property exists and is active
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, host_id, title, minimum_stay, number_of_guests, is_active')
      .eq('id', id)
      .single()

    if (propertyError) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    if (!property.is_active) {
      return NextResponse.json({ error: 'Property is not active' }, { status: 400 })
    }

    // Prevent booking your own property
    if (property.host_id === parseInt(payload.user_id)) {
      return NextResponse.json({ error: 'You cannot book your own property' }, { status: 400 })
    }

    // Validate dates
    const checkIn = new Date(check_in_date)
    const checkOut = new Date(check_out_date)
    const today = new Date()
    
    // Remove time portion for date comparison
    today.setHours(0, 0, 0, 0)
    
    if (checkIn < today) {
      return NextResponse.json({ error: 'Check-in date cannot be in the past' }, { status: 400 })
    }
    
    if (checkIn.getTime() === checkOut.getTime()) {
      return NextResponse.json({ error: 'Check-in and check-out dates cannot be the same' }, { status: 400 })
    }
    
    if (checkOut <= checkIn) {
      return NextResponse.json({ error: 'Check-out date must be after check-in date' }, { status: 400 })
    }
    
    // Calculate number of days for the stay
    const timeDiff = checkOut.getTime() - checkIn.getTime()
    const numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24))
    
    // Validate minimum stay
    if (numberOfDays < property.minimum_stay) {
      return NextResponse.json({ 
        error: `Stay must be at least ${property.minimum_stay} days` 
      }, { status: 400 })
    }
    
    // Validate guest count
    if (guests_count > property.number_of_guests) {
      return NextResponse.json({ 
        error: `Maximum number of guests allowed is ${property.number_of_guests}` 
      }, { status: 400 })
    }
    
    // Format dates for Supabase query
    const formattedCheckIn = check_in_date.split('T')[0]
    const formattedCheckOut = check_out_date.split('T')[0]
    
    // Validate availability
    const { data: availabilities, error: availabilityError } = await supabase
      .from('propertyavailability')
      .select('*')
      .eq('property_id', id)
      .lte('start_date', formattedCheckIn)
      .gte('end_date', formattedCheckOut)
      .eq('is_available', true)
      .neq('availability_type', 'booked')
      .neq('availability_type', 'blocked')
    
    if (availabilityError) {
      return NextResponse.json({ 
        error: 'Failed to check property availability' 
      }, { status: 500 })
    }
    
    if (!availabilities || availabilities.length === 0) {
      return NextResponse.json({ 
        error: 'Selected dates are not available' 
      }, { status: 400 })
    }
    
    // Check for overlapping reservations
    const { data: overlappingReservations, error: overlappingError } = await supabase
      .from('reservations')
      .select('*')
      .eq('property_id', id)
      .or(`check_in_date,lt.${formattedCheckOut},check_out_date,gt.${formattedCheckIn}`)
      .in('status', ['pending', 'approved'])
    
    if (overlappingError) {
      return NextResponse.json({ 
        error: 'Failed to check existing reservations' 
      }, { status: 500 })
    }
    
    if (overlappingReservations && overlappingReservations.length > 0) {
      return NextResponse.json({ 
        error: 'These dates conflict with an existing reservation' 
      }, { status: 400 })
    }
    
    // Create the reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        property_id: id,
        user_id: payload.user_id,
        check_in_date: formattedCheckIn,
        check_out_date: formattedCheckOut,
        guests_count,
        total_price,
        status: 'pending'
      })
      .select()
      .single()
    
    if (reservationError) {
      return NextResponse.json({ 
        error: `Failed to create reservation: ${reservationError.message}` 
      }, { status: 500 })
    }
    
    // Create a notification for the property owner
    await supabase
      .from('reservationnotifications')
      .insert({
        user_id: property.host_id,
        reservation_id: reservation.id,
        type: 'reservation_request',
        message: `You have a new reservation request for "${property.title}"`
      })
    
    // Return the created reservation
    return NextResponse.json({
      id: reservation.id,
      property_id: reservation.property_id,
      user_id: reservation.user_id,
      check_in_date: reservation.check_in_date,
      check_out_date: reservation.check_out_date,
      guests_count: reservation.guests_count,
      total_price: reservation.total_price,
      status: reservation.status,
      created_at: reservation.created_at
    }, { status: 201 })
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}