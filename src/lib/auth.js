import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import supabase from '../services/supabase';

// Generate an access token (15 minutes)
export function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
}

// Generate a refresh token (6 months)
export function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '6m',
  });
}

// Store refresh token in database
export async function storeRefreshToken(adminId, token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const { error } = await supabase
    .from('AdminRefreshTokens')
    .insert({
      admin_id: adminId,
      token: hashedToken,
      expires_at: new Date(Date.now() + 182 * 24 * 60 * 60 * 1000).toISOString() // 6 months
    });

  if (error) {
    console.error('Error storing refresh token:', error);
    throw new Error('Failed to store refresh token');
  }
}

// Verify access token
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

// Validate refresh token against database
export async function validateRefreshToken(adminId, token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const { data, error } = await supabase
    .from('AdminRefreshTokens')
    .select('*')
    .eq('admin_id', adminId)
    .eq('token', hashedToken)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

// Set cookies for authentication
export function setAuthCookies(accessToken, refreshToken) {
  const cookieStore = cookies();
  
  // Set access token cookie (httpOnly for security)
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60, // 15 minutes in seconds
    path: '/'
  });
  
  // Set refresh token cookie
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 182 * 24 * 60 * 60, // 6 months in seconds
    path: '/'
  });
}

// Clear auth cookies
export function clearAuthCookies() {
  const cookieStore = cookies();
  
  cookieStore.set('access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });
  
  cookieStore.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });
}

// Get admin from access token
export async function getAdmin(accessToken) {
  if (!accessToken) return null;
  
  const decoded = verifyAccessToken(accessToken);
  if (!decoded) return null;
  
  const { data, error } = await supabase
    .from('Admins')
    .select('admin_id, first_name, last_name, email')
    .eq('admin_id', decoded.sub)
    .single();
  
  if (error || !data) return null;
  
  return data;
}

// Auth middleware helper
export async function isAuthenticated() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  
  if (!accessToken) {
    return false;
  }
  
  const admin = await getAdmin(accessToken);
  return !!admin;
}

// Helper for password hashing
export function hashPassword(password) {
  return crypto.pbkdf2Sync(
    password,
    process.env.JWT_SECRET.slice(0, 16),
    10000,
    64,
    'sha512'
  ).toString('hex');
}

// Helper to verify password
export function verifyPassword(password, hashedPassword) {
  const hash = crypto.pbkdf2Sync(
    password,
    process.env.JWT_SECRET.slice(0, 16),
    10000,
    64,
    'sha512'
  ).toString('hex');
  
  return hash === hashedPassword;
}