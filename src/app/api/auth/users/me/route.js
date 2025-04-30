// src/app/api/auth/users/me/route.js
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
    
    // Only select the fields we need to return
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, email_verified, identity_verified, profile_image, created_at, updated_at')
      .eq('id', payload.user_id)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'User retrieval failed' }, { status: 500 });
    }

    // Return the user directly without restructuring
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { accessToken } = await getAuthTokens(request);
    
    if (!accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await verifyToken(accessToken);
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const updateData = await request.json();
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }
    
    // Filter to allowed fields directly
    const { first_name, last_name, profile_image } = updateData;
    const updateObject = {
      updated_at: new Date().toISOString(),
      ...(first_name !== undefined && { first_name }),
      ...(last_name !== undefined && { last_name }),
      ...(profile_image !== undefined && { profile_image })
    };
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateObject)
      .eq('id', payload.user_id)
      .select('id, first_name, last_name, email, role, email_verified, identity_verified, profile_image, created_at, updated_at')
      .single();
    
    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
    
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}