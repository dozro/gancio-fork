import { jwtVerify, SignJWT } from 'jose'
import type { UserSession } from './session'
import { get as getConfig } from '../services/config'

const config = getConfig()
const secret = new TextEncoder().encode(config.session_password)

// a different secret is used for e-mail change tokens, otherwise they would be accepted as bearer tokens
const emailChangeSecret = new TextEncoder().encode(`${config.session_password}:email_change`)

export async function signJwt(payload: UserSession, expiresIn = '1 day') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(secret)
}

export async function verifyJwtToken(token: string) {
  const { payload } = await jwtVerify(token, secret)
  return payload as UserSession
}

/** `email` is the current address of the user, the token is not valid anymore once it changes */
export type EmailChangePayload = { id: number, email: string, new_email: string }

export async function signEmailChangeToken(payload: EmailChangePayload, expiresIn = '1 day') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(emailChangeSecret)
}

export async function verifyEmailChangeToken(token: string) {
  const { payload } = await jwtVerify(token, emailChangeSecret)
  return payload as EmailChangePayload
}
