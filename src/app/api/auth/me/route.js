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
      username: admin.username
    }
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json(error.message, { status: 500 })
  }
}
