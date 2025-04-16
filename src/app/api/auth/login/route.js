// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server'
import supabase from '@/app/services/supabase'
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '@/app/lib/auth'
import bcrypt from 'bcryptjs'

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
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (userError || !user) {
      return NextResponse.json({ error: `User retrieval failed: ${userError.message}` }, { status: 500 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    

    const payload = {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role // guest or admin
    }
    
    const accessToken = await generateAccessToken(payload)
    const refreshToken = await generateRefreshToken(payload)

    await setAuthCookies(accessToken, refreshToken)
    
    // role not included in the response for security reasons
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