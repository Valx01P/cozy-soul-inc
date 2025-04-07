// src/app/lib/auth.js
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

/**
 * Generates an access token for the authenticated admin
 * @param {Object} payload - Data to be encoded in the token
 * @returns {string} JWT access token
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 7 * 24 * 60 * 60 }) // 2 hours
}

/**
 * Generates a refresh token for extending sessions
 * @param {Object} payload - Data to be encoded in the token
 * @returns {string} JWT refresh token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: 6 * 30 * 24 * 60 * 60 }) // 6 months
}

/**
 * Verifies a JWT access token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export async function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Verifies a JWT refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export async function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Sets HTTP-only cookies for access and refresh tokens
 * @param {Object} response - Next.js Response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export async function setAuthCookies(accessToken, refreshToken) {
  const cookieStore = await cookies()
  
  // Set access token as HTTP-only cookie
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60, // 2 hours in seconds
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    // maxAge: 15 * 60, // 15 minutes in seconds
    path: '/'
  })
  
  // Set refresh token as HTTP-only cookie
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 6 * 30 * 24 * 60 * 60, // 6 months in seconds
    expires: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months
    path: '/'
  })
}

/**
 * Clears auth cookies
 * @param {Object} response - Next.js Response object
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies()
  
  cookieStore.set('access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    expires: new Date(0), // Set to past date to delete cookie
    path: '/'
  })
  
  cookieStore.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    expires: new Date(0), // Set to past date to delete cookie
    path: '/'
  })
}

/**
 * Gets auth tokens from cookies or headers
 * @param {Object} request - Next.js Request object
 * @returns {Object} Object containing access and refresh tokens
 */
export async function getAuthTokens() {
  const cookieStore = await cookies()
  let accessToken = cookieStore.get('access_token')?.value
  let refreshToken = cookieStore.get('refresh_token')?.value
  
  // If not in cookies, check authorization header (for API clients like Postman)
  // const authHeader = request.headers.get('authorization')
  // if (!accessToken && authHeader && authHeader.startsWith('Bearer ')) {
  //   accessToken = authHeader.split(' ')[1]
  // }
  
  // For testing with Postman, also check if refresh token is in header
  // const refreshHeader = request.headers.get('x-refresh-token')
  // if (!refreshToken && refreshHeader) {
  //   refreshToken = refreshHeader
  // }
  
  return { accessToken, refreshToken }
}