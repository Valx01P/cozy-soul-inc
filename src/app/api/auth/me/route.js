// src/app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdmin } from '@/app/lib/auth';

export async function GET() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const admin = await getAdmin(accessToken);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ admin });
  } catch (error) {
    console.error('Error getting admin data:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}