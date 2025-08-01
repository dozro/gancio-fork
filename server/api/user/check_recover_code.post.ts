export default defineEventHandler(async (event) => {
  const log = useLogger('user/check_recover_code')
  const { recoverCode } = await readBody(event)
  if (!recoverCode) {
    throw createError({ status: 400 })
  }

  const user = await User.findOne({ where: { recover_code: recoverCode } })
  if (!user) {
    log.error('User not found')
    throw createError({ status: 400 })
  }

  return { email: user.email }

})