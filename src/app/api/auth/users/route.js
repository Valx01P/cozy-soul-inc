import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
import supabase from '@/app/services/supabase'

// TESTING ONLY - ADMIN ONLY

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
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  profile_image VARCHAR(255) DEFAULT 'https://placehold.co/1024x1024/png?text=User',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/

/*
  @description
  Retrieves all users' information from the database.
  This is typically used for admin panels or user management interfaces.
  Only accessible by admin users.

  @requires
  ACCESS_TOKEN, ADMIN_ROLE

  @returns
  [
    {
      "id": "1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "example@gmail.com",
      "phone": "1234567890",
      "role": "guest",
      "email_verified": false,
      "phone_verified": false,
      "identity_verified": false,
      "profile_image": "https://example.com/profile.jpg",
      "created_at": "2023-10-01T12:00:00Z",
      "updated_at": "2023-10-01T12:00:00Z"
    },
    more users...
  ]
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

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')

    if (usersError) {
      if (usersError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Users not found' }, { status: 404 })
      }
      return NextResponse.json({ error: `Users retrieval failed: ${usersError.message}` }, { status: 500 })
    }

    const response = [
      ...users.map(user => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        identity_verified: user.identity_verified,
        profile_image: user.profile_image,
        created_at: user.created_at,
        updated_at: user.updated_at
      }))
    ]

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}