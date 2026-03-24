import { verifyJwtToken } from '../lib/jwt'
import { type H3Event, useSession, clearResponseHeaders, getHeader } from 'h3'
import { User, type UserRole } from '../services/db'

export type UserSession = { id: number, email: string, role: UserRole }
/**
 * Get the user of the request based on `nuxt-session` cookie or JWT Bearer token
 * @todo
 */
export async function getUser(event: H3Event<EventHandlerRequest>) {
  let session
  if (typeof getUserSession === 'undefined') {
    session = await useSession(event, { password: process.env.NUXT_SESSION_PASSWORD!, name: 'nuxt-session' })
    session = session.data
  } else {
    session = await getUserSession(event)
  }
  let user: UserSession | undefined = session?.user

  if (!user) {
    // FIX:
    // ref: https://github.com/orgs/h3js/discussions/1250
    clearResponseHeaders(event, ['set-cookie'])

    const authHeader = getHeader(event, 'authorization')
    const token = authHeader?.split(' ')[1]
    if (token) {
      try {
        const payload = await verifyJwtToken(token)

        // Attach decoded user info to context
        user = {
          id: payload.id,
          email: payload.email,
          role: payload.role
        } as UserSession
      } catch (err) {
        console.warn('Invalid JWT:', err)
      }
    }
  }

  if (!user) return
  // check if user exists and is enabled
  const u = await User.findByPk(user.id, { where: { is_active: true }, attributes: ['id', 'email', 'role'], raw: true })
    .then(u => u || undefined)
    .catch(err => {
      console.warn('Error finding user by id:', err)
      return undefined
    })
  return u
}

// TODO
export async function setSession(event: H3Event<EventHandlerRequest>, user: UserSession) {
  if (typeof setUserSession === 'undefined') {
    const session = await useSession(event, { password: process.env.NUXT_SESSION_PASSWORD!, name: 'nuxt-session' })
    await session.update(user)
    return session.data
  }
  const userSession = await setUserSession(event, user)
  return userSession
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
  const user = await isSessionRole(evt, roles)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

// check if current user role is one of specified
export async function isSessionRole(evt: H3Event<EventHandlerRequest>, roles: UserRole[] | UserRole) {
  const user = await getUser(evt)
  if (!user) return
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
