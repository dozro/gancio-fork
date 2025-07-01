// server/utils/jwt.ts

import { jwtVerify, SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-dev-secret')

export async function signJwt(payload: object, expiresIn = '1h') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(secret)
}

export async function verifyJwtToken(token: string): Promise<any> {
  const { payload } = await jwtVerify(token, secret)
  return payload
}