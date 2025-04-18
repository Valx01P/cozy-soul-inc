import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/app/lib/auth'

/*
  @description
  Clears the authentication cookies from the browser.
  This is typically used when the user logs out of the application.

  @requires
  NOTHING

  @returns
  REMOVES THE COOKIES FROM THE BROWSER

  @throws
  {
    "error": "Some error message"
  }
*/
export async function POST() {
  try {
    await clearAuthCookies()
    
    return NextResponse.json({ status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
