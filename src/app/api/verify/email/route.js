import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
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
  identity_verified BOOLEAN DEFAULT FALSE,
  profile_image VARCHAR(255) DEFAULT 'https://placehold.co/1024x1024/png?text=User',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE emailverificationcodes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  code VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- on new code, just override the old one
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
 */

/**
 * Handles email code cross reference verification (PUBLIC ROUTE)
 * Requires a valid access token, updates the user's email_verified status in the database
 * Example Request Body:
 * {
 *   "code": "123456"
 * }
 */
export async function POST(request) {
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

    if (payload.email_verified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const { data: verification, error: verificationError } = await supabase
      .from('emailverificationcodes')
      .select('*')
      .eq('user_id', payload.user_id)
      .eq('code', code)
      .single()

    if (verificationError) {
      if (verificationError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Verification code not found' }, { status: 404 })
      }
      return NextResponse.json({ error: `Verification code retrieval failed: ${verificationError.message}` }, { status: 500 })
    }

    const currentTime = new Date()
    const expiresAt = new Date(verification.expires_at)

    if (currentTime > expiresAt) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('id', payload.user_id)

    if (updateError) {
      return NextResponse.json({ error: `User email verification status update failed: ${updateError.message}` }, { status: 500 })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.user_id)
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