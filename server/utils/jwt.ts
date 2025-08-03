// server/utils/jwt.ts

import { JWTPayload, jwtVerify, SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.NUXT_SESSION_SECRET)

export async function signJwt(payload: JWTPayload, expiresIn = '1m') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(secret)
}

export async function verifyJwtToken(token: string): Promise<any> {
  const { payload } = await jwtVerify(token, secret)
  return payload
}