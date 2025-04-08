// middleware.js (in root directory)
import { NextResponse } from 'next/server';
import * as jose from 'jose';

// This function has to be defined here since the middleware runs in the Edge Runtime
// and can't import from app directory
async function verifyTokenInMiddleware(token) {
  try {
    // Make sure to use the same secret as in your auth.js file
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Token verification failed in middleware:', error.message);
    return null;
  }
}

export async function middleware(request) {
  // Debug info
  console.log('Middleware running for path:', request.nextUrl.pathname);
  
  // Get the access token from the cookies
  const accessToken = request.cookies.get('access_token')?.value;
  
  // Debug token
  console.log('Access token present:', !!accessToken);
  
  // Redirect URL to login page if authentication fails
  const loginUrl = new URL('/admin', request.url);
  
  // If no token exists, redirect to login
  if (!accessToken) {
    console.log('No access token found, redirecting to login');
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // Verify the token directly in middleware
    const payload = await verifyTokenInMiddleware(accessToken);
    
    // If token is invalid or expired, redirect to login
    if (!payload) {
      console.log('Invalid or expired token, redirecting to login');
      return NextResponse.redirect(loginUrl);
    }
    
    // Debug successful auth
    console.log('Valid token, user authenticated:', payload.userId || payload.sub);
    
    // If token is valid, allow the request
    return NextResponse.next();
  } catch (error) {
    console.error('Error verifying token:', error);
    // If token verification fails, redirect to login
    return NextResponse.redirect(loginUrl);
  }
}

// Apply middleware to these routes
export const config = {
  matcher: [
    '/admin/listings/create',
    '/admin/listings/:id',
    '/admin/listings/:id/edit',
  ],
};