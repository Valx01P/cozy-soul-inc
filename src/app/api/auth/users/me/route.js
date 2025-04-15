// src/app/api/auth/me/route.js
import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
import supabase from '@/app/services/supabase'


/**
 * Returns the currently authenticated admin's information
 * Requires a valid access token
 */
export async function GET(request) {
  try {
    // Get the access token from cookie or auth header
    const { accessToken } = await getAuthTokens(request)
    
    if (!accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify the token
    const payload = await verifyToken(accessToken)
    
    if (!payload || !payload.admin_id) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }
    
    // Get admin info from database
    const { data: admin, error: aError } = await supabase.from('admins').select('*').eq('id', payload.admin_id).single()
    
    if (aError) {
      throw new Error(`Error fetching admin, ${aError.message}`)
    } else if (!admin) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 })
    }
    
    const response = {
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
      username: admin.username,
      profile_image: admin.profile_image,
    }
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json(error.message, { status: 500 })
  }
}


/**
 * Updates the currently authenticated admin's information
 * Requires a valid access token
 * 
 * @example Request Body:
 * {
 *   "first_name": "Updated First",
 *   "last_name": "Updated Last",
 *   "username": "updated_username",
 *   "email": "updated@example.com",
 *   "password": "new_password", // Optional
 *   "profile_image": "https://example.com/new-image.jpg" // Optional
 * }
 */
export async function PUT(request) {
  try {
    // Get the access token from cookie or auth header
    const { accessToken } = await getAuthTokens(request)
    
    if (!accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify the token
    const payload = await verifyToken(accessToken)
    
    if (!payload || !payload.admin_id) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }
    
    // Get the update data from the request body
    const updateData = await request.json()
    
    // Validate input - at least one field must be provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No update data provided' }, { status: 400 })
    }
    
    // Construct the update object with only the fields that are allowed to be updated
    const allowedFields = ['first_name', 'last_name', 'username', 'email', 'password', 'profile_image']
    const updateObject = {}
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateObject[field] = updateData[field]
      }
    })
    
    // Update the admin in the database
    const { data: updatedAdmin, error: updateError } = await supabase
      .from('admins')
      .update(updateObject)
      .eq('id', payload.admin_id)
      .select('first_name, last_name, email, username, profile_image')
      .single()
    
    if (updateError) {
      throw new Error(`Error updating admin: ${updateError.message}`)
    }
    
    if (!updatedAdmin) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 })
    }
    
    // Return the updated admin information
    const response = {
      message: 'Profile updated successfully',
      admin: updatedAdmin
    }
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}