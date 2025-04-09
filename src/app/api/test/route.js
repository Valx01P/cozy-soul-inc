// src/app/api/test-supabase/route.js
import { NextResponse } from 'next/server'
import supabase from '@/app/services/supabase'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    // Simple health check query
    const { data, error } = await supabase
      .from('admins')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: 'Supabase connection successful' }, { status: 200 })
  } catch (error) {
    console.error('Error testing Supabase connection:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}