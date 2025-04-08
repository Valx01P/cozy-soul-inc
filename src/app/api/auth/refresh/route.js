// src/app/api/auth/refresh/route.js
import { NextResponse } from 'next/server'
import { 
  verifyRefreshToken, 
  generateAccessToken, 
  generateRefreshToken, 
  setAuthCookies,
  getAuthTokens 
} from '@/app/lib/auth'

/**
 * Refreshes the access token using a valid refresh token
 * Sets new HTTP-only cookies and returns new tokens
 */
export async function POST() {
  try {
    // Get the refresh token from cookie or header
    const { refreshToken } = await getAuthTokens()
    
    if (!refreshToken) {
      return NextResponse.json({ message: 'Refresh token is required' }, { status: 401 })
    }
    
    // Verify the refresh token
    const payload = await verifyRefreshToken(refreshToken)
    
    if (!payload || !payload.admin_id) {
      return NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 })
    }
    
    // Generate new tokens
    const newPayload = {
      admin_id: payload.admin_id,
      email: payload.email,
      username: payload.username
    }
    
    // Correct version with awaits
    const newAccessToken = await generateAccessToken(newPayload)
    const newRefreshToken = await generateRefreshToken(newPayload)

    // Set HTTP-only cookies
    await setAuthCookies(newAccessToken, newRefreshToken)

    const response = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }
    
    // Return tokens in response for testing with Postman
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json(error.message, { status: 500 })
  }
}