// src/app/api/auth/logout/route.js
import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/app/lib/auth'

 /*
    @description
    Clears ACCESS and REFRESH tokens from cookies
 */
export async function POST() {
  try {
    await clearAuthCookies()

    const response = {
      message: 'Logged out successfully'
    }
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
