import type { User, UserSessionRequired, UserSession } from '#auth-utils'
import { verifyJwtToken } from './jwt'

type UseSessionEvent = Parameters<typeof useSession>[0]

/**
 * Get the user of the request based on `nuxt-session` cookie or JWT Bearer token
 */
export async function getUser(event: UseSessionEvent) {

  const session = await getUserSession(event)
  if (session?.user) {
    return session.user
  }

  // FIX:
  // deleteCookie(event, 'nuxt-session')
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
        role: payload.role,
        is_editor: payload.role === 'editor',
        is_admin: payload.role === 'admin'
      } as User

    } catch (err) {
      console.warn('Invalid JWT:', err)
    }
  }

  return null
}

/**
 * Require an user to be authenticated (via cookie or JWT token)
 */
export async function requireUser(event: UseSessionEvent) {
  const user = await getUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return user
}

/**
 * Require an user via a specified role (admin|editor) to be authenticated (via cookie or JWT token)
 */
export async function requireRole(event: UseSessionEvent, role: string) {
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
export async function requireAdminSession(event: UseSessionEvent, opts: { statusCode?: number, message?: string } = {}) {
  const userSession = await getUser(event)

  if (!userSession) {
    if (isEvent(event)) {
      throw createError({
        statusCode: opts.statusCode || 401,
        statusMessage: opts.message || 'Unauthorized',
      })
    }
    else {
      throw new Response(opts.message || 'Unauthorized', {
        status: opts.statusCode || 401,
      })
    }
  }

  if (userSession?.role !== 'admin') {
    throw createError({
      statusCode: opts.statusCode || 401,
      statusMessage: opts.message || 'Unauthorized',
    })
  }

  return userSession
}
