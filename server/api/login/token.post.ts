import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { signJwt } from '~/server/utils/jwt'

const bodySchema = z.object({
  email: z.string(), //TODO: .email(), // or admin
  password: z.string()
})

export default defineEventHandler(async (event) => {
  const log = useLogger('login')
  // const body = await readBody(event)
  const { email, password } = await readValidatedBody(event, bodySchema.parse)
  log.info(`Login ${email}`)
  
  // search for the username
  const user = await User.withScope('withPassword').findOne({ where: { email, is_active: true } })
  if (!user || !password) {
    log.warn('E-mail not found or not active', email)
    throw createError({ status: 401, message: 'Bad credentials' })
  }
  
  // check if password matches
  if (await bcrypt.compare(password, user.password)) {
    // set the user session in the cookie
    // this server util is auto-imported by the auth-utils module
    const token = await signJwt({
      user: {
        email: user.email,
        role: user.role,
      }
    })
    return { token }
  } else {
    throw createError({ statusCode: 401, message: 'Bad credentials' })
  }
})
