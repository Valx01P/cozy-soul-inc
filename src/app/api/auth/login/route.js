// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server'
import supabase from '@/app/services/supabase'
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '@/app/lib/auth'

/**
 * Handles admin login with email and password
 * Returns JWT tokens for authenticated users
 * 
 * @example Request Body:
 * {
 *   "email": "admin@example.com",
 *   "password": "password123"
 * }
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json()
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }
    
    // Query for admin with matching email
    const { data: admin, error: aError } = await supabase.from('admins').select('*').eq('email', email).single()
    
    if (aError) {
      throw new Error(`Error fetching admin, ${aError.message}`)
    } else if (!admin) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 })
    }
        
    // For testing purposes, we're using unhashed passwords
    // In production, you would use bcrypt.compare() or similar
    if (admin.password !== password) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }
    
    // Admin is authenticated, generate tokens
    const payload = {
      admin_id: admin.id,
      email: admin.email,
      username: admin.username
    }
    
    const accessToken = await generateAccessToken(payload)
    const refreshToken = await generateRefreshToken(payload)

    // Set HTTP-only cookies
    await setAuthCookies(accessToken, refreshToken)
    
    // Return tokens in response for testing with Postman
    const response = {
      message: 'Login successful',
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
      username: admin.username,
      profile_image: admin.profile_image
    }
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json(error.message, { status: 500 })
  }
}