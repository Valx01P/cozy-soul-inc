// src/app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/app/lib/auth';

export async function POST() {
  try {
    // Clear auth cookies
    clearAuthCookies();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}