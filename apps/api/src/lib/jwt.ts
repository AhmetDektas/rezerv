import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'rezerv-secret-change-in-production'
const EXPIRES_IN = '7d'

export type JwtPayload = {
  userId: string
  role: 'CUSTOMER' | 'BUSINESS_OWNER' | 'ADMIN'
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload
}
