// src/app/lib/auth.js
import * as jose from 'jose';
import { cookies } from 'next/headers';

// Create secret keys from environment variables
const getAccessSecret = async () => {
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

const getRefreshSecret = async () => {
  return new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);
};

/**
 * Generates an access token for the authenticated user
 * @param {Object} payload - Data to be encoded in the token
 * @returns {string} JWT access token
 */
export async function generateAccessToken(payload) {
  const secret = await getAccessSecret();
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days
    .sign(secret);
}

/**
 * Generates a refresh token for extending sessions
 * @param {Object} payload - Data to be encoded in the token
 * @returns {string} JWT refresh token
 */
export async function generateRefreshToken(payload) {
  const secret = await getRefreshSecret();
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('180d') // 6 months
    .sign(secret);
}

/**
 * Verifies a JWT access token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export async function verifyToken(token) {
  try {
    const secret = await getAccessSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

/**
 * Verifies a JWT refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export async function verifyRefreshToken(token) {
  try {
    const secret = await getRefreshSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Refresh token verification failed:', error.message);
    return null;
  }
}

/**
 * Sets HTTP-only cookies for access and refresh tokens
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export async function setAuthCookies(accessToken, refreshToken) {
  const cookieStore = cookies();
  
  // Set access token as HTTP-only cookie
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/'
  });
  
  // Set refresh token as HTTP-only cookie
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 6 * 30 * 24 * 60 * 60, // ~6 months in seconds
    path: '/'
  });
}

/**
 * Clears auth cookies
 */
export async function clearAuthCookies() {
  const cookieStore = cookies();
  
  cookieStore.set('access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/'
  });
  
  cookieStore.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/'
  });
}

/**
 * Gets auth tokens from cookies in a request
 * @param {Object} request - The Next.js request object
 * @returns {Object} Object containing access and refresh tokens
 */
export async function getAuthTokens(request) {
  // If request is provided (for API routes), get tokens from request cookies
  if (request) {
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;
    return { accessToken, refreshToken };
  }
  
  // Otherwise (for server components), get tokens from the cookies() API
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  
  return { accessToken, refreshToken };
}