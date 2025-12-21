/**
 * enqueue a password recovery email for the logged in user
 */
export default defineEventHandler(async (event) => {
  const log = useLogger('user/recover')
  const user = await requireUser(event)
  
  const userInstance = await User.findByPk(user.id)
  if (!userInstance) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  await userInstance.generateRecoverCode()
  enqueueMail(userInstance.email, 'recover', { user, config: publicSettings }, event.context.locale)

})
