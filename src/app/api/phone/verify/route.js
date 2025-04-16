// src/app/api/phone/verify/route.js
import { NextResponse } from 'next/server'
import supabase from '@/app/services/supabase'
import twilioClient from '@/app/services/twilio'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
import { generateRandomCode } from '@/app/lib/utils'

/**
 * Handles phone verification
 * Sends a verification code to the user's phone via SMS
 * Requires a valid access token
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

    const { user_id, phone_verified } = payload

    if (phone_verified) {
      return NextResponse.json({ error: 'Phone already verified' }, { status: 400 })
    }

    // Get user's phone number
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('phone, first_name')
      .eq('id', user_id)
      .single()

    if (userError) {
      return NextResponse.json({ error: `Failed to retrieve user data: ${userError.message}` }, { status: 500 })
    }

    if (!user.phone) {
      return NextResponse.json({ error: 'No phone number associated with this account' }, { status: 400 })
    }

    // Format phone number for Twilio (remove hyphens, spaces, etc.)
    const formattedPhone = user.phone.replace(/[^0-9]/g, '')
    
    // Add +1 for US numbers if not already present
    const phoneWithCountryCode = formattedPhone.startsWith('1') 
      ? `+${formattedPhone}` 
      : `+1${formattedPhone}`

    const verificationCode = generateRandomCode(6)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

    // Check if a code already exists for this user
    const { data: existingCode, error: existingCodeError } = await supabase
      .from('phoneverificationcodes')
      .select('id')
      .eq('user_id', user_id)
      .single()

    if (existingCodeError && existingCodeError.code !== 'PGRST116') {
      return NextResponse.json({ error: `Database error: ${existingCodeError.message}` }, { status: 500 })
    }

    // Insert or update verification code
    const { error: codeError } = existingCode 
      ? await supabase
          .from('phoneverificationcodes')
          .update({ 
            code: verificationCode, 
            expires_at: expiresAt,
            updated_at: new Date().toISOString() 
          })
          .eq('id', existingCode.id)
      : await supabase
          .from('phoneverificationcodes')
          .insert({ 
            user_id, 
            code: verificationCode, 
            expires_at: expiresAt 
          })

    if (codeError) {
      return NextResponse.json({ error: `Failed to save verification code: ${codeError.message}` }, { status: 500 })
    }

    // Send SMS via Twilio
    try {
      await twilioClient.messages.create({
        body: `Hi ${user.first_name}, your Cozy Soul verification code is: ${verificationCode}. This code will expire in 15 minutes.`,
        from: process.env.TWILIO_VIRTUAL_PHONE_NUMBER,
        to: phoneWithCountryCode
      })
    } catch (twilioError) {
      return NextResponse.json({ error: `Failed to send SMS: ${twilioError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Verification code sent successfully'
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}