import { z } from 'zod'
import bcrypt from 'bcryptjs'

const bodySchema = z.object({
  email: z.string(), //.email(), // or admin
  password: z.string()
})

export default defineEventHandler(async (event) => {
  const log = useLogger('login')
  // const body = await readBody(event)
  const { email, password } = await readValidatedBody(event, bodySchema.parse)
  log.info(`Login ${email}`)
  
  // search for the username
  const user = await User.findOne({ where: { email, is_active: true } })
  if (!user || !password) {
    log.warn('email not found or not active', email)
    throw createError({ status: 404, message: 'Not Found' })
  }
  
  // check if password matches
  if (await bcrypt.compare(password, user.password)) {
    // set the user session in the cookie
    // this server util is auto-imported by the auth-utils module
    
    await setUserSession(event, {
      user: {
        email: user.email,
        role: user.role,
      }
    })
    return { email: user.email, role: user.role }
  } else {
    throw createError({
      statusCode: 401,
      message: 'Bad credentials'
    })
  }
})
