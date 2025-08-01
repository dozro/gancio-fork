export default defineEventHandler(async (event) => {
  const log = useLogger('user/recover')
  
  const { recoverCode, password } = await readBody(event)
  if (!recoverCode || !password) {
    throw createError({ status: 400 })
  }
  
  const user = await User.findOne({ where: { recover_code: recoverCode, is_active: true } })
  if (!user) {
    log.error('User not found')
    throw createError({ status: 400})
  }
  
  try {
    await user.update({ recover_code: '', password })
    setResponseStatus(event, 201)
  } catch (e) {
    setResponseStatus(event, 400)
  }


})
