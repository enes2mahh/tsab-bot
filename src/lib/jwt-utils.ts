import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.OTP_JWT_SECRET || process.env.WA_SERVER_SECRET || 'otp-fallback-secret-change-in-prod'
const EXPIRY_MS = 15 * 60 * 1000 // 15 minutes

interface OTPPayload {
  phone: string
  otp_id: string
  type: 'otp_verification'
  iat: number
  exp: number
}

function sign(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

function verify(token: string): OTPPayload | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const data = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expected = createHmac('sha256', SECRET).update(data).digest('base64url')
    // Constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as OTPPayload
    if (payload.type !== 'otp_verification') return null
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

export function generateOTPToken(phone: string, otpId: string): string {
  const now = Date.now()
  return sign({
    phone,
    otp_id: otpId,
    type: 'otp_verification',
    iat: now,
    exp: now + EXPIRY_MS,
  })
}

export function verifyOTPToken(token: string): { phone: string; otp_id: string } | null {
  if (!token || typeof token !== 'string') return null
  const payload = verify(token)
  if (!payload) return null
  return { phone: payload.phone, otp_id: payload.otp_id }
}
