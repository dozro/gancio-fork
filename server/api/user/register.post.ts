/**
  
  @todo
*/
export default defineEventHandler(async event => {
  const log = useLogger('register')
  const user = await readBody(event)
  if (!publicSettings.allow_registration) { throw createError({ status: 404, message: 'Not found' }) }
  
  const n_users = await User.count()
  try {

    // the first registered user will be an active admin
    if (n_users === 0) {
      log.info('First user!')
      user.is_active = user.is_admin = true
      user.role = 'admin'
      return User.create(user)
    }

    // user.is_active = false
    // user.is_admin = false

    // check email
    // if (!linkify.test(user.email, 'email')) {
      // return res.status(404).json('Invalid email')
    // }

    log.info('Register user ', user.email)
    const userInstance = await User.create(user)
    log.info(`Sending registration email to ${user.email} and registration confirmation to admins`)
    const config = useRuntimeConfig()
    enqueueMail(user.email, 'register', { user, config } ) //, TODO publicSettings.locals.locale)
    
    notifyAdmins('admin_register', { user, config })
    return userInstance
    
  } catch (e) {
    log.error('Registration error:', e)
    throw createError({ status: 400, statusText: String(e) })
  }
})
