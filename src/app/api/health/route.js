import { NextResponse } from 'next/server';
import supabase from '@/services/supabase';

export async function GET() {
  try {
    // Test database connection
    const { data, error } = await supabase.from('Admins').select('count(*)', { count: 'exact' });
    
    if (error) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Database connection failed',
          error: error.message
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      services: {
        supabase: 'connected'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Health check failed',
        error: error.message
      },
      { status: 500 }
    );
  }
}

// export async function GET() {
//   return Response.json({ message: 'Hello World!' })
// }