// src/app/api/auth/users/[id]/route.js
import { NextResponse } from 'next/server';
import supabase from '@/app/services/supabase';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Authentication check removed for now since it was commented out in the original code
    // Select only needed fields
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, email_verified, identity_verified, profile_image, created_at, updated_at')
      .eq('id', id)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'User retrieval failed' }, { status: 500 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}