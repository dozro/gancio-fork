
export default defineEventHandler(async (event) => {
  const log = useLogger('user/recover')
  const { email } = await readBody(event)
  const user = await User.findOne({ where: { email, is_active: true } })
  if (!user) {
    log.error('User not found')
    return
  }

  await user.generateRecoverCode()
  // mail(user.email, 'recover', { user, config })
  sendMail(user.email, 'recover', { user, config: publicSettings })

})
