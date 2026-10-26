import { defineEventHandler, readValidatedBody, createError } from 'h3'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireUser } from '~~/server/lib/auth'
import { signEmailChangeToken } from '~~/server/lib/jwt'
import { useLogger } from '~~/server/lib/logger'
import { getFirstZodError } from '~~/server/helpers'
import { User, enqueueMail, publicSettings } from '~~/server/services'
import { isEmailTaken } from '~~/server/services/users'

const bodySchema = z.object({
  email: z.email({ error: 'Invalid email' }),
  password: z.string({ error: 'Password is required' }).min(1, { error: 'Password is required' })
})

/**
 * @openapi
 * /api/user/change_email:
 *   post:
 *     summary: Request e-mail change
 *     description: Request to change the e-mail of the current user. A confirmation link is sent to the new address,
 *       the e-mail is changed only when the link is confirmed (see `/api/user/change_email_confirm`).
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
 *                 description: New e-mail.
 *                 example: new@gancio.org
 *               password:
 *                 type: string
 *                 required: true
 *                 description: Current password of the user.
 *                 example: MY_PASSWORD
 *     responses:
 *       204:
 *         description: A confirmation email has been enqueued to the new address.
 *       400:
 *         description: Invalid e-mail, same e-mail or e-mail already in use.
 *       401:
 *         description: Unauthorized or wrong password.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Users
 */
export default defineEventHandler(async (event) => {
  const log = useLogger('user/change_email')
  const session = await requireUser(event)

  const { success, error, data } = await readValidatedBody(event, bodySchema.safeParse)
  if (!success) {
    throw createError({ statusCode: 400, message: getFirstZodError(error) })
  }

  const user = await User.withScope('withPassword').findOne({ where: { id: session.id, is_active: true } })
  if (!user || !user.password || !await bcrypt.compare(data.password, user.password)) {
    log.warn('Bad credentials for e-mail change of user %s', session.id)
    throw createError({ statusCode: 401, message: 'Bad credentials' })
  }

  if (data.email === user.email) {
    throw createError({ statusCode: 400, message: 'This is already your e-mail' })
  }

  if (await isEmailTaken(data.email, user.id)) {
    throw createError({ statusCode: 400, message: 'This e-mail is already in use.' })
  }

  const token = await signEmailChangeToken({ id: user.id, email: user.email, new_email: data.email })
  log.info(`Send e-mail change confirmation for ${user.email} to ${data.email}`)
  enqueueMail(data.email, 'change_email', { token, config: publicSettings }, event.context.locale)
})
