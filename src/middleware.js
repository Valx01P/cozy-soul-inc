import { NextResponse } from 'next/server'
import * as jose from 'jose'

async function verifyTokenInMiddleware(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET) // access token
    const { payload } = await jose.jwtVerify(token, secret)
    return payload
  } catch (error) {
    console.error('Token verification failed in middleware:', error.message)
    return null
  }
}

export async function middleware(request) {

  const accessToken = request.cookies.get('access_token')?.value
  
  const loginUrl = new URL('/admin', request.url)
  

  if (!accessToken) {
    return NextResponse.redirect(loginUrl)
  }
  
  try {
    const payload = await verifyTokenInMiddleware(accessToken)
    
    if (!payload) {
      console.log('Invalid or expired token, redirecting to login')
      return NextResponse.redirect(loginUrl)
    }
        
    // If token is valid, allow the request
    return NextResponse.next()
  } catch (error) {
    console.error('Error verifying token:', error)
    // If token verification fails, redirect to login
    return NextResponse.redirect(loginUrl)
  }
}

// Apply middleware to these routes
export const config = {
  matcher: [
    '/admin/listings/create',
    '/admin/listings/:id',
    '/admin/listings/:id/edit',
  ],
}