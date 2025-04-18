// src/app/api/auth/refresh/route.js
import { NextResponse } from 'next/server'
import { 
  verifyRefreshToken, 
  generateAccessToken, 
  generateRefreshToken, 
  setAuthCookies,
  getAuthTokens 
} from '@/app/lib/auth'

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
  Refreshes the access and refresh tokens using the refresh token.
  This is typically used when the access token has expired and a new one is needed.

  @requires
  REFRESH_TOKEN

  @returns
  ACCESS_TOKEN, REFRESH_TOKEN

  @throws
  {
    "error": "Some error message"
  }
*/
export async function POST() {
  try {

    const { refreshToken } = await getAuthTokens()
    
    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 401 })
    }
    

    const payload = await verifyRefreshToken(refreshToken)
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
    }
    

    const newPayload = {
      user_id: payload.user_id,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      role: payload.role,
      email_verified: payload.email_verified,
      identity_verified: payload.identity_verified
    }
    
    const newAccessToken = await generateAccessToken(newPayload)
    const newRefreshToken = await generateRefreshToken(newPayload)


    await setAuthCookies(newAccessToken, newRefreshToken)

    const response = {
      message: 'Tokens refreshed successfully'
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}