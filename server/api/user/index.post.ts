import { User, enqueueMail, publicSettings } from '../../services'
import { useLogger } from '~~/server/lib/logger'
/**
 * Create a new user.
 * a recovery code is generated and sent via email to allow
 * the user to set their password and confirm their account creation
 *
 * @auth
 * @param {string} email - User email address
 * @param {string} description - User description
 * @param {string} role - User role ('user','admin','editor')
 * @returns Created user object
 * @returns status `400` if user creation fails (e.g. email already exists)
 */
export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const log = useLogger('user')

  const newUser = await readBody(event)
  log.info(newUser)

  try {
    newUser.recover_code = crypto.randomUUID()
    const user = await User.withScope('withRecoverCode').create(newUser)
    enqueueMail(user.email, 'user_confirm', { user, config: publicSettings })
    return user
  } catch (e) {
    log.error('User creation error:', e)
    throw createError({ status: 400, message: String(e) })
  }
})
