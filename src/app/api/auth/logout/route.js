// src/app/api/auth/logout/route.js
import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/app/lib/auth'

/**
 * Handles user logout by clearing auth cookies
 */
export async function POST() {
  try {
    // Clear authentication cookies
    await clearAuthCookies()

    const response = {
      message: 'Logged out successfully'
    }
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json(error.message, { status: 500 })
  }
}
