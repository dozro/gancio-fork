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

/**
 * Require an user via a specified role (admin|editor) to be authenticated (via cookie or JWT token)
 */
export async function requireRole(event: H3Event<EventHandlerRequest>, role: string) {
  const user = await requireUser(event)

  if (user?.role !== role) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return user
}

/**
 * Require a user session, throw a 401 error if the user is not logged in
 * @param event
 * @param opts Options to customize the error message and status code
 * @param opts.statusCode The status code to use for the error (defaults to 401)
 * @param opts.message The message to use for the error (defaults to Unauthorized)
 * @see https://github.com/atinux/nuxt-auth-utils
 */
export async function requireAdminSession(event: H3Event<EventHandlerRequest>, opts: { statusCode?: number, message?: string } = {}) {
  const userSession = await getUser(event)

  if (!userSession) {
    if (isEvent(event)) {
      throw createError({
        statusCode: opts.statusCode || 401,
        statusMessage: opts.message || 'Unauthorized'
      })
    }
    else {
      throw new Response(opts.message || 'Unauthorized', {
        status: opts.statusCode || 401
      })
    }
  }

  if (userSession?.role !== 'admin') {
    throw createError({
      statusCode: opts.statusCode || 401,
      statusMessage: opts.message || 'Unauthorized'
    })
  }

  return userSession
}
