/**
 * enqueue a password recovery email for specified email address
 */
export default defineEventHandler(async (event) => {
  const log = useLogger('user/recover')

  const { email } = await readBody(event)
  const user = await User.findOne({ where: { email, is_active: true } })

  if (!user) {
    log.warn('User not found', email)
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  await user.generateRecoverCode()
  enqueueMail(user.email, 'recover', { user, config: publicSettings }, event.context.locale)
})
