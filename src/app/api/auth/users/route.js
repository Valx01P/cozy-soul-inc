// src/app/api/auth/users/route.js
import { NextResponse } from 'next/server';
import { verifyToken, getAuthTokens } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

export async function GET(request) {
  try {
    const { accessToken } = await getAuthTokens(request);

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(accessToken);
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Select only needed fields, don't use * to improve query performance
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, email_verified, identity_verified, profile_image, created_at, updated_at');

    if (usersError) {
      return NextResponse.json({ error: 'Users retrieval failed' }, { status: 500 });
    }

    // Return the users directly without restructuring each one
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}