
import { NextResponse } from 'next/server';
import supabase from '@/services/supabase';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  setAuthCookies, 
  storeRefreshToken,
  verifyPassword
} from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Fetch the admin with the provided email
    const { data: admin, error } = await supabase
      .from('Admins')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error || !admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isPasswordValid = verifyPassword(password, admin.hashed_password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate tokens
    const accessToken = generateAccessToken({ sub: admin.admin_id });
    const refreshToken = generateRefreshToken({ sub: admin.admin_id });
    
    // Store refresh token in database
    await storeRefreshToken(admin.admin_id, refreshToken);
    
    // Set auth cookies
    setAuthCookies(accessToken, refreshToken);
    
    // Return success with user info (exclude sensitive data)
    return NextResponse.json({
      admin: {
        id: admin.admin_id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}