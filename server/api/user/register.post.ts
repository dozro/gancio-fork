import { defineEventHandler, createError, readValidatedBody } from 'h3'
import { z } from 'zod'
import { useLogger } from '~~/server/lib/logger'
import { getFirstZodError } from '~~/server/helpers'
import { enqueueMail, publicSettings, User, notifyAdmins } from '~~/server/services'

// TODO flood protection

// whitelist: nothing that is not listed here reaches the model, in particular
// `role` and `is_active`, which are assigned server-side below
const userSchema = z.object({
  email: z.email({ error: 'Invalid email' }),
  password: z.string({ error: 'Password is required' }).min(8, { error: 'Password must be at least 8 characters' }).max(100),
  description: z.string().min(5).max(255).optional()
})

/**
 * @openapi
 * /api/user/register:
 *   post:
 *     summary: Register user
 *     description: Register a new user. This will send an email to the user and to all the administrators. The first registered user will be an active admin, any other account is created with the `user` role and inactive, waiting for an administrator to confirm it. Any other request body field (in particular `role` and `is_active`) is ignored.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 required: true
 *                 description: User email
 *                 example: example@gancio.org
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: MY_PASSWORD
 *               description:
 *                 type: string
 *                 description: User description
 *                 example: A new user for gancio
 *     responses:
 *       200:
 *         description: User has been registered.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Creation error.
 *       404:
 *         description: Registration not allowed.
 *     tags:
 *       - Users
 */
export default defineEventHandler(async (event) => {
  const log = useLogger('register')

  if (!publicSettings.allow_registration) {
    throw createError({ status: 404, message: 'Registration is disabled' })
  }

  const { success, error, data } = await readValidatedBody(event, userSchema.safeParse)
  if (!success) {
    throw createError({ status: 400, message: getFirstZodError(error) })
  }

  // the first registered user will be an active admin
  const isFirstUser = (await User.count()) === 0
  if (isFirstUser) {
    log.info('First registered user will be an admin')
  }
  log.info('Register user', data.email)

  try {
    const userInstance = await User.create({
      email: data.email,
      password: data.password,
      description: data.description,
      role: isFirstUser ? 'admin' : 'user',
      is_active: isFirstUser
    })

    if (!isFirstUser) {
      log.info(`Sending registration email to ${data.email} and registration confirmation to admins`)
      enqueueMail(data.email, 'register', { user: userInstance, config: publicSettings })
      notifyAdmins('admin_register', { user: userInstance, config: publicSettings })
    }

    // refetch with the default scope, so the response never carries the password hash
    return await User.findByPk(userInstance.id)
  } catch (e) {
    log.error(String(e))
    throw createError({ status: 400, statusMessage: String(e) })
  }
})
