import { NextResponse } from 'next/server'
import supabase from '@/app/services/supabase'
import resend from '@/app/services/resend'
import VerifyCodeEmail from '@/app/components/emails/VerifyCodeEmail'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
import { generateRandomCode } from '@/app/lib/utils'

/**
 *
CREATE TABLE Users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE, -- Required for OAuth users, null for others
  password TEXT, -- Required for password-based auth
  email_verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(50) NOT NULL DEFAULT 'guest', -- 'guest', 'admin'
  phone VARCHAR(20),
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE EmailVerificationCodes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  code VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
 */

/**
 * Handles email verification
 * Sends a verification code to the user's email
 * Requires a valid access token
*/
export async function POST(request) {
  try {
    const { accessToken } = await getAuthTokens(request)

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(accessToken)

    /**
     * @example Payload:
     * {
     *   "user_id": "123",
     *   "first_name": "John",
     *   "last_name": "Doe",
     *   "email": "user@example.com",
     *   "role": "guest"
     * }
     */

    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { user_id, email, first_name, last_name } = payload


    const verificationCode = generateRandomCode(6)

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

    const { error: dbError } = await supabase
      .from('emailverificationcodes')
      .insert({ user_id, code: verificationCode, expires_at: expiresAt })

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    const { error: emailError } = await resend.emails.send({
      from: 'Cozy Soul Inc <noreplay@scriptphi.com>',
      to: email,
      subject: 'Email Verification Code',
      react: VerifyCodeEmail({ verificationCode, first_name, last_name })
    })

    if (emailError) {
      return NextResponse.json({ error: emailError.message }, { status: 500 })
    }

    const response = {
      message: 'Email sent successfully'
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}