import { NextResponse } from 'next/server'
import supabase from '@/app/services/supabase'
import bcrypt from 'bcryptjs'
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '@/app/lib/auth'

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
 * Handles native user sign up
 * @example Request Body:
 * {
 *   "first_name": "John",
 *   "last_name": "Doe",
 *   "email": "user@example.com",
 *   "phone": "1234567890",
 *   "password": "yourpassword" -- will be hashed
 * }
 */
export async function POST(request) {
  try {
    const { first_name, last_name, email, phone, password } = await request.json()

    if (!first_name || !last_name || !email || !phone || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const { data: existingUsers, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)


    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }


    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }


    const hashedPassword = await bcrypt.hash(password, 10)


    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert({ first_name, last_name, email, phone, password: hashedPassword })
      .select()
      .single()

    if (createUserError) {
      return NextResponse.json({ error: createUserError.message }, { status: 500 })
    }

    const payload = {
      user_id: newUser.id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
      role: newUser.role, // 'guest'
      email_verified: newUser.email_verified,
      phone_verified: newUser.phone_verified,
      identity_verified: newUser.identity_verified
    }

    const accessToken = await generateAccessToken(payload)
    const refreshToken = await generateRefreshToken(payload)

    await setAuthCookies(accessToken, refreshToken)

    // role not included in the response for security reasons
    const response = {
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
      phone: newUser.phone,
      email_verified: newUser.email_verified,
      phone_verified: newUser.phone_verified,
      identity_verified: newUser.identity_verified,
      profile_image: newUser.profile_image,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}