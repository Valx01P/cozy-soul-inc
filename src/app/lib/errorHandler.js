import { googleOAuth } from '@/app/config/oauth'

export function getOAuthErrorMessage(errorCode) {
  return googleOAuth.errorMessages[errorCode] || 'Authentication error'
}

export function logAuthError(context, error) {
  console.error(`Auth error (${context}):`, error)
}

export function redirectWithError(errorCode) {
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?error=${errorCode}`)
}