import { NextResponse } from 'next/server';
import supabase from '@/services/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('PropertyTypes')
      .select('*')
      .order('type_name');
    
    if (error) {
      console.error('Error fetching property types:', error);
      return NextResponse.json(
        { error: 'Failed to fetch property types' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Property types error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}