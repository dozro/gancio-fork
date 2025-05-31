import type { UserSessionRequired } from '#auth-utils'

type UseSessionEvent = Parameters<typeof useSession>[0]

/**
 * Require a user session, throw a 401 error if the user is not logged in
 * @param event
 * @param opts Options to customize the error message and status code
 * @param opts.statusCode The status code to use for the error (defaults to 401)
 * @param opts.message The message to use for the error (defaults to Unauthorized)
 * @see https://github.com/atinux/nuxt-auth-utils
 */
export async function requireAdminSession(event: UseSessionEvent, opts: { statusCode?: number, message?: string } = {}): Promise<UserSessionRequired> {
  const userSession = await getUserSession(event)

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