import { defineEventHandler, readValidatedBody, createError } from 'h3'
import { z } from 'zod'
import { verifyEmailChangeToken } from '~~/server/lib/jwt'
import { getUserSession, setUserSession } from '~~/server/lib/session'
import { useLogger } from '~~/server/lib/logger'
import { User, enqueueMail, publicSettings } from '~~/server/services'
import { isEmailTaken } from '~~/server/services/users'

const bodySchema = z.object({
  token: z.string().min(1)
})

/**
 * @openapi
 * /api/user/change_email_confirm:
 *   post:
 *     summary: Confirm e-mail change
 *     description: Change the e-mail of a user using the token sent to the new address by `/api/user/change_email`.
 *       A notification is sent to the old address. The token expires after one day and can be used only once.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 required: true
 *                 description: E-mail change token.
 *     responses:
 *       200:
 *         description: E-mail has been changed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   description: New e-mail of the user.
 *                   example: new@gancio.org
 *       400:
 *         description: Invalid or expired token, or e-mail already in use.
 *     tags:
 *       - Users
 */
export default defineEventHandler(async (event) => {
  const log = useLogger('user/change_email')

  const { success, data } = await readValidatedBody(event, bodySchema.safeParse)
  const payload = success && await verifyEmailChangeToken(data.token).catch(() => undefined)
  if (!payload) {
    throw createError({ statusCode: 400, message: 'Invalid or expired link' })
  }

  // the token is valid only while the user still has the e-mail it was issued for
  const user = await User.findOne({ where: { id: payload.id, email: payload.email, is_active: true } })
  if (!user) {
    log.warn('E-mail change token not valid anymore for user %s', payload.id)
    throw createError({ statusCode: 400, message: 'Invalid or expired link' })
  }

  if (await isEmailTaken(payload.new_email, user.id)) {
    throw createError({ statusCode: 400, message: 'This e-mail is already in use.' })
  }

  const old_email = user.email
  await user.update({ email: payload.new_email }).catch((e) => {
    log.error('Cannot change e-mail:', e)
    throw createError({ statusCode: 400, message: 'This e-mail is already in use.' })
  })
  log.info(`E-mail changed from ${old_email} to ${user.email}`)
  enqueueMail(old_email, 'email_changed', { new_email: user.email, config: publicSettings }, event.context.locale)

  // update the session if this user is logged in
  const session = await getUserSession(event)
  if (session?.id === user.id) {
    await setUserSession(event, { id: user.id, email: user.email, role: user.role })
  }

  return { email: user.email }
})
