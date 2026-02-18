import { useLogger } from '~~/server/lib/logger'
import { User } from '~~/server/services'

export default defineEventHandler(async (event) => {
  const log = useLogger('user/recover')

  const { recover_code, password } = await readBody(event)
  if (!recover_code || !password) {
    throw createError({ statusCode: 400, message: 'Wrong password or recover code' })
  }

  const user = await User.findOne({ where: { recover_code, is_active: true } })
  if (!user) {
    log.error('User not found')
    throw createError({ statusCode: 400, message: 'User not found' })
  }

  try {
    await user.update({ recover_code: '', password })
    setResponseStatus(event, 201)
  } catch {
    setResponseStatus(event, 400)
  }
})
