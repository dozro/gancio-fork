// import { z } from 'zod'
import * as linkify from 'linkifyjs'
/**
 * Register a new user
 * This will send an email to the user and to all the administrators
 * @todo flood protection
 * @info The first registered user will be an active admin
 * @param {string} email - user e-mail
 * @param {string} password - password
 * @param {string} description - description
 */
 

// TODO
// const userSchema = z.object({
//   email: z.string().email(),
//   password: z.string().min(8).max(100),
//   description: z.string().min(5).max(255).optional()
// })

export default defineEventHandler(async event => {
  const log = useLogger('register')
  
  // const user = await readValidatedBody(event, userSchema.parse)
  const user = await readBody(event)
  
  if (!publicSettings.allow_registration) { throw createError({ status: 404, message: 'Not found' }) }

  const n_users = await User.count()
  try {

    // the first registered user will be an active admin
    if (n_users === 0) {
      log.info('First registered user will be an admin')
      user.is_active = user.is_admin = true
      user.role = 'admin'

      const userInstance = await User.create(user)
      return userInstance.get({ plain: true })
    }

    // user.is_active = false
    // user.is_admin = false

    // check email
    if (!linkify.test(user.email, 'email')) {
      throw createError({ status: 400, statusMessage: 'Invalid email' })
    }

    log.info('Register user', user.email)
    const userInstance = await User.create(user)
    log.info(`Sending registration email to ${user.email} and registration confirmation to admins`)
    const config = useRuntimeConfig()
    enqueueMail(user.email, 'register', { user, config }) //, TODO publicSettings.locals.locale)

    notifyAdmins('admin_register', { user, config })
    return userInstance

  } catch (e) {
    log.error(String(e))
    throw createError({ status: 400, statusMessage: String(e) })
  }
})
