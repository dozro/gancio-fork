export default defineEventHandler(async (event) => {
  const log = useLogger('user/recover')

  const { recover_code, password } = await readBody(event)
  if (!recover_code || !password) {
    throw createError({ status: 400 })
  }

  const user = await User.findOne({ where: { recover_code, is_active: true } })
  if (!user) {
    log.error('User not found')
    throw createError({ status: 400 })
  }

  try {
    await user.update({ recover_code: '', password })
    setResponseStatus(event, 201)
  } catch (e) {
    setResponseStatus(event, 400)
  }


})
