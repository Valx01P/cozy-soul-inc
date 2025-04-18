// src/app/api/auth/google/callback/route.js
import { NextResponse } from 'next/server'
import supabase from '@/app/services/supabase'
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '@/app/lib/auth'

/*
  @description
  Handles Google OAuth callback
  Exchanges authorization code for tokens and user info
  Creates or updates user in the database
  Sets JWT tokens as HTTP-only cookies
  
  @returns
  REDIRECTS TO LOGIN PAGE ON ERROR OR USER DASHBOARD ON SUCCESS
  
  @throws
  {
    "error": "Some error message"
  }
*/
export async function GET(request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') || '/'
    
    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=no_code`)
    }

    // Exchange code for access token and ID token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=token_exchange`)
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })
    
    const googleUser = await userInfoResponse.json()
    
    if (!userInfoResponse.ok) {
      console.error('Error fetching user info:', googleUser)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=user_info`)
    }

    // Check if user exists in our database
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .maybeSingle()
    
    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding user:', findError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=db_error`)
    }

    let user
    
    if (existingUser) {
      // Update existing user with latest Google info
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          google_id: googleUser.id,
          first_name: googleUser.given_name || existingUser.first_name,
          last_name: googleUser.family_name || existingUser.last_name,
          profile_image: googleUser.picture || existingUser.profile_image,
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating user:', updateError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=update_error`)
      }
      
      user = updatedUser
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          google_id: googleUser.id,
          first_name: googleUser.given_name || '',
          last_name: googleUser.family_name || '',
          email: googleUser.email,
          profile_image: googleUser.picture || 'https://placehold.co/1024x1024/png?text=User',
          email_verified: true,
          role: 'guest'
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=create_error`)
      }
      
      user = newUser
    }

    // Generate JWT tokens
    const payload = {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      identity_verified: user.identity_verified
    }
    
    const accessToken = await generateAccessToken(payload)
    const refreshToken = await generateRefreshToken(payload)
    
    // Set HTTP-only cookies
    await setAuthCookies(accessToken, refreshToken)

    // Redirect to the original intended destination (or homepage)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}${state}`)
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=oauth_failed`)
  }
}