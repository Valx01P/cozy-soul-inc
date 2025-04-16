import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens, clearAuthCookies } from '@/app/lib/auth'
import supabase from '@/app/services/supabase'

/**
 *
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE, -- Required for OAuth users, null for others
  password TEXT, -- Required for password-based auth
  email_verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(50) NOT NULL DEFAULT 'guest', -- 'guest', 'admin'
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  profile_image VARCHAR(255) DEFAULT 'https://placehold.co/1024x1024/png?text=User',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 */

/**
 * Returns the currently authenticated admin's information
 * Requires a valid access token
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
     *   "phone_verified": false,
     *   "identity_verified": false
     * }
     */
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    const { user_id } = payload

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('first_name, last_name, email, email_verified, phone, phone_verified, identity_verified, profile_image, created_at, updated_at')
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
      phone: user.phone,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
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


/**
 * Updates the current user's basic information
 * Requires a valid access token
 * 
 * @example Request Body:
 * {
 *   "first_name": "Updated First",
 *   "last_name": "Updated Last",
 *   "profile_image": "https://example.com/new-image.jpg"
 * }
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
     *   "phone_verified": false,
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
    
    // Construct the update object with only the fields that are allowed to be updated
    const allowedFields = ['first_name', 'last_name', 'profile_image']
    const updateObject = {}

    const currentDate = new Date().toISOString()
    updateObject['updated_at'] = currentDate
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateObject[field] = updateData[field]
      }
    })
    
    // Update the user in the database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateObject)
      .eq('id', payload.user_id)
      .select('first_name, last_name, email, email_verified, phone, phone_verified, identity_verified, profile_image, created_at, updated_at')
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
      phone: updatedUser.phone,
      email_verified: updatedUser.email_verified,
      phone_verified: updatedUser.phone_verified,
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


// TESTING ONLY - ANY USER

/**
 * Deletes the current user's account
 * Requires a valid access token
 */
export async function DELETE(request) {
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
     *   "phone_verified": false,
     *   "identity_verified": false
     * }
     */
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    const { user_id } = payload
    
    // check user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json({ error: `User retrieval failed: ${userError.message}` }, { status: 500 })
    }
      
    // delete user
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', user_id)
    
    if (deleteUserError) {
      return NextResponse.json({ error: `Deletion failed: ${deleteUserError.message}` }, { status: 500 })
    }

    const response = {
      message: 'User deleted successfully'
    }

    await clearAuthCookies()
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}