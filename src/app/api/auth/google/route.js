// src/app/api/auth/google/route.js
import { NextResponse } from 'next/server';

/**
 * Initiates Google OAuth flow by redirecting to Google's authorization endpoint
 */
export async function GET(request) {
  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`;

    // Define the Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'openid email profile');
    googleAuthUrl.searchParams.append('prompt', 'select_account');
    
    // Get the redirect URL from the query params, or default to /
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirect') || '/';
    
    // Add the redirect URL as state parameter to maintain user's intended destination
    googleAuthUrl.searchParams.append('state', redirectTo);

    // Redirect to Google OAuth
    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=oauth_init_failed`);
  }
}