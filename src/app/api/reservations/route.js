import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
import supabase from '@/app/services/supabase'

/**
 * Returns all reservations from every user for admin
 * Returns all reservations by user for the user
 * Requires valid access token
 */





