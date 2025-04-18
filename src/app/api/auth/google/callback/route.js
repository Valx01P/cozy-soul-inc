import { NextResponse } from 'next/server'
import supabase from '@/app/services/supabase'
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '@/app/lib/auth'
import { googleOAuth } from '@/app/config/oauth'
import { logAuthError } from '@/app/lib/errorHandler'

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
      return redirectWithError('no_code')
    }

    // Exchange code for tokens
    const tokenData = await exchangeCodeForTokens(code)
    if (!tokenData) {
      return redirectWithError('token_exchange')
    }
    
    // Get user info
    const googleUser = await getUserInfo(tokenData.access_token)
    if (!googleUser) {
      return redirectWithError('user_info')
    }
    
    // Create or update user
    const user = await createOrUpdateUser(googleUser)
    if (!user) {
      return redirectWithError('db_error')
    }
    
    // Generate and set tokens
    await setUserAuthCookies(user)
    
    // Redirect to destination
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}${state}`)
  } catch (error) {
    logAuthError('Google OAuth callback', error)
    return redirectWithError('oauth_failed')
  }
}

// Helper function to redirect with error
function redirectWithError(errorCode) {
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=${errorCode}`)
}

// Exchange auth code for tokens
async function exchangeCodeForTokens(code) {
  try {
    const tokenResponse = await fetch(googleOAuth.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: googleOAuth.redirectUri,
        grant_type: 'authorization_code'
      })
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      logAuthError('token exchange', tokenData)
      return null
    }

    return tokenData
  } catch (error) {
    logAuthError('exchanging code for tokens', error)
    return null
  }
}

// Get user info from Google
async function getUserInfo(accessToken) {
  try {
    const userInfoResponse = await fetch(googleOAuth.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    
    const googleUser = await userInfoResponse.json()
    
    if (!userInfoResponse.ok) {
      logAuthError('fetching user info', googleUser)
      return null
    }

    return googleUser
  } catch (error) {
    logAuthError('getting user info', error)
    return null
  }
}

// Create or update user in database
async function createOrUpdateUser(googleUser) {
  try {
    // Check if user exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .maybeSingle()
    
    if (findError && findError.code !== 'PGRST116') {
      logAuthError('finding user', findError)
      return null
    }

    if (existingUser) {
      return await updateExistingUser(existingUser, googleUser)
    } else {
      return await createNewUser(googleUser)
    }
  } catch (error) {
    logAuthError('creating/updating user', error)
    return null
  }
}

// Update existing user
async function updateExistingUser(existingUser, googleUser) {
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
    logAuthError('updating user', updateError)
    return null
  }
  
  return updatedUser
}

// Create new user
async function createNewUser(googleUser) {
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      google_id: googleUser.id,
      first_name: googleUser.given_name || '',
      last_name: googleUser.family_name || '',
      email: googleUser.email,
      profile_image: googleUser.picture || 'https://placehold.co/1024x1024/png?text=User',
      email_verified: true
    })
    .select()
    .single()
  
  if (createError) {
    logAuthError('creating user', createError)
    return null
  }
  
  return newUser
}

// Set user authentication cookies
async function setUserAuthCookies(user) {
  const payload = {
    user_id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    email_verified: user.email_verified,
    identity_verified: user.identity_verified
  }
  
  const accessToken = await generateAccessToken(payload)
  const refreshToken = await generateRefreshToken(payload)
  
  await setAuthCookies(accessToken, refreshToken)
}