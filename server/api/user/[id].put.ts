import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { requireAdmin } from '~~/server/lib/auth'
import { useLogger } from '~~/server/lib/logger'
import { enqueueMail, User, publicSettings } from '~~/server/services'

/**
 * @openapi
 * /api/user/{id}:
 *   put:
 *     summary: Update user
 *     description: Update user activation or role. When user is activated, a confirmation e-mail is sent with a link that allow to choose a password.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         example: 1
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 example: true
 *               role:
 *                 type: string
 *                 enum: [user,editor,admin]
 *                 example: user
 *     responses:
 *       200:
 *         description: User has been updated.
 *       404:
 *         description: User does not exist.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Users
 */
export default defineEventHandler(async (evt) => {
  await requireAdmin(evt)
  const log = useLogger('user update')
  const id = getRouterParam(evt, 'id')
  const body = await readBody(evt)

  const user = await User.findByPk(id)
  if (!user) {
    log.error('This user does not exist: ', id)
    throw createError({ status: 404, message: 'This user does not exists' })
  }

  log.info(`Update user ${user.email} - ${JSON.stringify(body)}`)
  if ((!user.is_active && body.is_active)) {
    enqueueMail(user.email, 'confirm', { user, config: publicSettings }, publicSettings.instance_locale)
  }

  return user.update(body)
})
