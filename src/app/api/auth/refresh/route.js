import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  verifyRefreshToken, 
  validateRefreshToken, 
  generateAccessToken, 
  setAuthCookies 
} from '@/app/lib/auth';

export async function POST(request) {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  
  if (!refreshToken) {
    return NextResponse.json(
      { error: 'Refresh token not found' },
      { status: 401 }
    );
  }
  
  try {
    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }
    
    // Validate against database
    const isValid = await validateRefreshToken(decoded.sub, refreshToken);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Refresh token revoked or expired' },
        { status: 401 }
      );
    }
    
    // Generate new access token
    const newAccessToken = generateAccessToken({ sub: decoded.sub });
    
    // Set new access token in cookie
    cookieStore.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes in seconds
      path: '/'
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}