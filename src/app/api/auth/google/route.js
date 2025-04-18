import { NextResponse } from 'next/server'
import { googleOAuth } from '@/app/config/oauth'
import { logAuthError } from '@/app/lib/errorHandler'

/*
  @description
  Redirects the user to Google's OAuth 2.0 authorization endpoint.
  The user will be prompted to log in and authorize the application.
    
  @returns
  REDIRECTS TO GOOGLE AUTHORIZATION PAGE
  
  @throws
  {
    "error": "Some error message"
  }
*/
export async function GET(request) {
  try {
    const url = new URL(request.url)
    const redirectTo = url.searchParams.get('redirect') || '/'
    
    // Build the Google OAuth URL
    const googleAuthUrl = new URL(googleOAuth.authUrl)
    const params = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: googleOAuth.redirectUri,
      response_type: googleOAuth.responseType,
      scope: googleOAuth.scopes.join(' '),
      prompt: googleOAuth.prompt,
      state: redirectTo
    }
    
    // Add all parameters to URL
    Object.entries(params).forEach(([key, value]) => 
      googleAuthUrl.searchParams.append(key, value)
    )

    // Redirect to Google OAuth
    return NextResponse.redirect(googleAuthUrl.toString())
  } catch (error) {
    logAuthError('initiating Google OAuth', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=oauth_init_failed`)
  }
}