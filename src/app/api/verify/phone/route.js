// src/app/api/verify/phone/route.js
import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
import supabase from '@/app/services/supabase'

/**
 * Handles phone code verification
 * Requires a valid access token, updates the user's phone_verified status in the database
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
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (payload.phone_verified) {
      return NextResponse.json({ error: 'Phone already verified' }, { status: 400 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const { data: verification, error: verificationError } = await supabase
      .from('phoneverificationcodes')
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
      .update({ phone_verified: true })
      .eq('id', payload.user_id)

    if (updateError) {
      return NextResponse.json({ error: `User phone verification status update failed: ${updateError.message}` }, { status: 500 })
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