import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { signJwt } from '~~/server/utils/jwt'

const bodySchema = z.object({
  email: z.string(), // TODO: .email(), // or admin
  password: z.string()
})

/**
 * Login via JWT
 * To interact with some API you'll need an `access_token` you'll get from this call
 * @param {string} email
 * @param {string} password
 * @return A JSON response with an `access_token` property you have to use in `Authorization: Bearer <access_token>` header for authenticated request.
 * @return A 401 HTTP Status in case of bad credentials
 * @example
 * ```js
 * const auth = { email: 'admin', password: 'my_super_secret_password' }
 * fetch("http://localhost:4000/api/login/token", {
 *   "headers": { "content-type": "application/json" },
 *   "body": auth,
 *   "method": "POST"
 * })
 * ```
 */

export default defineEventHandler(async (event) => {
  const log = useLogger('login via API')
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
    // set the user session in the jwt token
    const access_token = await signJwt({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_admin: user.role === 'admin',
        is_editor: user.role === 'editor'
      }
    })
    return { access_token }
  } else {
    log.error('Bad credentials')
    throw createError({ statusCode: 401, message: 'Bad credentials' })
  }
})
