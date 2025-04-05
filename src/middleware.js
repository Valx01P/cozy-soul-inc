import { NextResponse } from 'next/server'
 
// This function can be marked `async` if using `await` inside
export function middleware(request) {
  const token = false
  const loginUrl = new URL('/admin', request.url)

  if (token) {
    return NextResponse.next()
  } else {
    return NextResponse.redirect(loginUrl)
  }
}
 
export const config = {
  matcher: [
    '/admin/listings/create',
    '/admin/listings/:id',
    '/admin/listings/:id/edit',
  ],
}

