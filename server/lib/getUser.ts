import { type H3Event, getHeader, clearResponseHeaders, useSession } from 'h3'
import { verifyJwtToken } from './jwt'
import { User } from '../services/db'


/**
 * Get the user of the request based on `nuxt-session` cookie or JWT Bearer token
 * @todo
 */
export async function getUser(event: H3Event) {
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