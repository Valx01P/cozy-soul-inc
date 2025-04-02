import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('Amenities')
      .select('*')
      .order('amenity_name');
    
    if (error) {
      console.error('Error fetching amenities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch amenities' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Amenities error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}