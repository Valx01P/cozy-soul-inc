import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens, clearAuthCookies } from '@/app/lib/auth'
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
*/

/*
  @description
  Retrieves the current user's information based on the provided access token.
  This is typically used to get the logged in user's profile information.

  @requires
  ACCESS_TOKEN

  @returns
  {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "123-456-7890",
    "email_verified": false,
    "identity_verified": false,
    "profile_image": "https://example.com/profile.jpg",
    "created_at": "2023-10-01T12:00:00Z",
    "updated_at": "2023-10-01T12:00:00Z"
  }

  @throws
  {
    "error": "Some error message"
  }
*/
export async function GET(request) {
  try {

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
    
    const { user_id } = payload

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json({ error: `User retrieval failed: ${userError.message}` }, { status: 500 })
    }

    const response = {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
      identity_verified: user.identity_verified,
      profile_image: user.profile_image,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


/*
  @description
  Updates the current user's information based on the provided access token.
  Only the first name, last name, and profile image can be updated.
  This is typically used to update the logged in user's profile information.

  @requires
  ACCESS_TOKEN,
  {
    "first_name": "Updated First",
    "last_name": "Updated Last",
    "profile_image": "https://example.com/new-image.jpg"
  }

  @returns
  {
    "first_name": "John",
    "last_name": "Doe",
    "email": "example@gmail.com",
    "role": "guest",
    "email_verified": false,
    "identity_verified": false,
    "profile_image": "https://example.com/profile.jpg",
    "created_at": "2023-10-01T12:00:00Z",
    "updated_at": "2023-10-01T12:00:00Z"
  }

  @throws
  {
    "error": "Some error message"
  }
*/
export async function PUT(request) {
  try {

    const { accessToken } = await getAuthTokens(request)
    
    if (!accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
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
    
    const updateData = await request.json()
    

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 })
    }
    
    // construct the update object with only the fields that are allowed to be updated
    const allowedFields = ['first_name', 'last_name', 'profile_image']
    const updateObject = {}

    const currentDate = new Date().toISOString()
    updateObject['updated_at'] = currentDate
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateObject[field] = updateData[field]
      }
    })
    
    // update the user in the database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateObject)
      .eq('id', payload.user_id)
      .select('*')
      .single()
    
    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json({ error: `Update failed: ${updateError.message}` }, { status: 500 })
    }
    
    // return the user information with the updated fields
    const response = {
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      email: updatedUser.email,
      role: updatedUser.role,
      email_verified: updatedUser.email_verified,
      identity_verified: updatedUser.identity_verified,
      profile_image: updatedUser.profile_image,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    }
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}