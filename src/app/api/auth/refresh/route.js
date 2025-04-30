// src/app/api/auth/refresh/route.js
import { NextResponse } from 'next/server'
import { 
  verifyRefreshToken, 
  generateAccessToken, 
  generateRefreshToken, 
  setAuthCookies,
  getAuthTokens 
} from '@/app/lib/auth'
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
// src/app/api/auth/refresh/route.js

export async function POST() {
  try {
    const { refreshToken } = await getAuthTokens();
    
    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 401 });
    }
    
    const payload = await verifyRefreshToken(refreshToken);
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }
    
    // Only select the fields we need - this improves query performance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, email_verified, identity_verified')
      .eq('id', payload.user_id)
      .single();
    
    if (userError) {
      return NextResponse.json({ error: 'Failed to refresh tokens' }, { status: 500 });
    }
    
    const newPayload = {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
      identity_verified: user.identity_verified
    };
    
    // Generate tokens in parallel for better performance
    const [newAccessToken, newRefreshToken] = await Promise.all([
      generateAccessToken(newPayload),
      generateRefreshToken(newPayload)
    ]);

    await setAuthCookies(newAccessToken, newRefreshToken);

    return NextResponse.json({ message: 'Tokens refreshed successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
  }
}