
export const googleOAuth = {
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v1/userinfo',
  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`,
  scopes: ['openid', 'email', 'profile'],
  responseType: 'code',
  prompt: 'select_account',
  
  // Error messages mapping
  errorMessages: {
    'oauth_init_failed': 'Failed to start Google login. Please try again.',
    'no_code': 'Google login failed. No authorization code received.',
    'token_exchange': 'Failed to authenticate with Google. Please try again.',
    'user_info': 'Could not retrieve user information from Google.',
    'db_error': 'Database error occurred. Please try again.',
    'update_error': 'Failed to update user information.',
    'create_error': 'Failed to create user account.',
    'oauth_failed': 'Google authentication failed. Please try again.'
  }
}