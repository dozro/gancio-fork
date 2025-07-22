import type { UserSessionRequired } from '#auth-utils'
import { verifyJwtToken } from './jwt'

type UseSessionEvent = Parameters<typeof useSession>[0]

export async function getUser(event: UseSessionEvent) {
  
  const session = await getUserSession(event)
  if (session?.user) {
    return session.user
  }

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
      }

      return
    } catch (err) {
      console.warn('Invalid JWT:', err)
    }
  }
  
  return null
}

export async function requireUser(event: UseSessionEvent) {
  const user = await getUser(event)
  if (!user) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }
  
  return user as UserSessionRequired
}

export async function requireRole(event: UseSessionEvent, role: string) {
  const user = await requireUser(event)
  
  if (user?.role !== role) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }
  
  return user as UserSessionRequired
}

/**
 * Require a user session, throw a 401 error if the user is not logged in
 * @param event
 * @param opts Options to customize the error message and status code
 * @param opts.statusCode The status code to use for the error (defaults to 401)
 * @param opts.message The message to use for the error (defaults to Unauthorized)
 * @see https://github.com/atinux/nuxt-auth-utils
 */
export async function requireAdminSession(event: UseSessionEvent, opts: { statusCode?: number, message?: string } = {}): Promise<UserSessionRequired> {
  const log = useLogger('session')
  const userSession = await getUserSession(event)
  log.info(userSession)

  if (!userSession.user) {
    if (isEvent(event)) {
      throw createError({
        statusCode: opts.statusCode || 401,
        message: opts.message || 'Unauthorized',
      })
    }
    else {
      throw new Response(opts.message || 'Unauthorized', {
        status: opts.statusCode || 401,
      })
    }
  }
  
  if (userSession.user.role !== 'admin') {
    throw createError({
      statusCode: opts.statusCode || 401,
      message: opts.message || 'Unauthorized',
    })    
  }

  return userSession as UserSessionRequired
}