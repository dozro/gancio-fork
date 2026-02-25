import { verifyJwtToken } from '../lib/jwt'
import type { H3Event } from 'h3'
import type { UserRole } from '../services/db'

export type UserSession = { id: number, email: string, role: UserRole }
/**
 * Get the user of the request based on `nuxt-session` cookie or JWT Bearer token
 */
export async function getUser(event: H3Event<EventHandlerRequest>) {
  const session = await getUserSession(event)
  if (session?.user) {
    return session.user
  }

  // FIX:
  // ref: https://github.com/orgs/h3js/discussions/1250
  clearResponseHeaders(event, ['set-cookie'])

  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.split(' ')[1]

  if (token) {
    try {
      const payload = await verifyJwtToken(token)

      // Attach decoded user info to context
      return {
        id: payload.userId,
        email: payload.email,
        role: payload.role
      } as UserSession
    } catch (err) {
      console.warn('Invalid JWT:', err)
    }
  }
}

/**
 * Require an user to be authenticated (via cookie or JWT token)
 */
export async function requireUser(event: H3Event<EventHandlerRequest>) {
  const user = await getUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return user
}

// require current user role to be one of the specified
export async function requireSessionRole(evt: H3Event<EventHandlerRequest>, roles: UserRole[] | UserRole) {
  const user = isSessionRole(evt, roles)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

// check if current user role is one of specified
export async function isSessionRole(evt: H3Event<EventHandlerRequest>, roles: UserRole[] | UserRole) {
  const user = await getUser(evt)
  if (!user) return false
  if (!Array.isArray(roles)) {
    roles = [roles]
  }
  return roles.includes(user?.role) ? user : false
}

/**
 * Require an admin session, throw a 401 error if the user is not logged in
 */
export async function requireAdminSession(evt: H3Event<EventHandlerRequest>) {
  return requireSessionRole(evt, 'admin')
}
