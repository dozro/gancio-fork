export default defineEventHandler(async (event) => {
  const log = useLogger('user/check_recover_code')
  const { recover_code } = await readBody(event)
  if (!recover_code) {
    throw createError({ status: 400 })
  }

  const user = await User.findOne({ where: { recover_code } })
  if (!user) {
    log.error('User not found')
    throw createError({ status: 400 })
  }

  return { email: user.email }

})
