  /**
    
    @todo withRecover scope
    @todo sendmail
  */
export default defineEventHandler(async event => {
  const log = useLogger('user')
  await requireAdminSession(event)
    
  const newUser = await readBody(event)
  log.info(newUser)
    
  const n_users = await User.count()
  try {
  
    // the first registered user will be an active admin
    if (n_users === 0) {
      log.info('First user!')
      newUser.is_active = newUser.is_admin = true
      newUser.role = 'admin'
      return User.create(newUser)
    } else {
      newUser.recover_code = crypto.randomUUID() //.toString('hex')
      // const user = await User.withScope('withRecover').create(newUser)
      const user = await User.create(newUser)
      // sendMail(user.email, 'user_confirm', { user, config }, res.locals.locale)
      return user
    }
  } catch (e) {
    log.error('User creation error:', e)
    throw createError({ status: 400, message: String(e) })
  }
})