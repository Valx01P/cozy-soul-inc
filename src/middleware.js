import { NextResponse } from 'next/server'
import { verifyToken } from './app/lib/auth'

export async function middleware(request) {
  // Get the access token from the cookies
  const accessToken = request.cookies.get('access_token')?.value

  // Redirect URL to login page if authentication fails
  const loginUrl = new URL('/admin', request.url)

  // If no token exists, redirect to login
  if (!accessToken) {
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Verify the token
    const payload = await verifyToken(accessToken)
    
    // If token is invalid or expired, redirect to login
    if (!payload || !payload.admin_id) {
      return NextResponse.redirect(loginUrl)
    }
    
    // If token is valid, allow the request
    return NextResponse.next()
  } catch (error) {
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

// import { NextResponse } from 'next/server'
 
// // This function can be marked `async` if using `await` inside
// export function middleware(request) {
//   const token = false
//   const loginUrl = new URL('/admin', request.url)

//   if (token) {
//     return NextResponse.next()
//   } else {
//     return NextResponse.redirect(loginUrl)
//   }
// }
 
// export const config = {
//   matcher: [
//     '/admin/listings/create',
//     '/admin/listings/:id',
//     '/admin/listings/:id/edit',
//   ],
// }

