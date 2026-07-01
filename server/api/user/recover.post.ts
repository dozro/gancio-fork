import { defineEventHandler, readBody, createError } from 'h3'
import { useLogger } from '../../lib/logger'
import { User, enqueueMail, publicSettings } from '../../services'

/**
 * @openapi
 * /api/user/recover:
 *   post:
 *     summary: Send recovery email
 *     description: Enqueue a password recovery email for specified email address.
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
 *                 description: User email.
 *                 example: example@gancio.org
 *     responses:
 *       204:
 *         description: A password recovery email has been enqueued.
 *       404:
 *         description: User not found.
 *     tags:
 *       - Users
 */
export default defineEventHandler(async (event) => {
  const log = useLogger('user/recover')

  const { email } = await readBody(event)
  const user = await User.findOne({ where: { email, is_active: true } })

  if (!user) {
    log.warn('User not found', email)
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  await user.generateRecoverCode()
  enqueueMail(user.email, 'recover', { user, config: publicSettings }, event.context.locale)
})