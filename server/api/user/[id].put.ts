import { defineEventHandler, readValidatedBody, createError, getRouterParam } from 'h3'
import { z } from 'zod'
import { requireAdmin } from '~~/server/lib/auth'
import { useLogger } from '~~/server/lib/logger'
import { getFirstZodError } from '~~/server/helpers'
import { enqueueMail, User, publicSettings } from '~~/server/services'

// the edit dialog posts the whole user object, blanking the fields it does not edit
const blankToUndefined = (value: unknown) => (value ? value : undefined)

// whitelist: nothing that is not listed here reaches the model. In particular an empty
// `password` means "keep the current one", never "clear it": leaving it undefined keeps
// the column untouched, since sequelize skips undefined values on update
const userSchema = z.object({
  role: z.enum(['admin', 'editor', 'user']).optional(),
  is_active: z.boolean().optional(),
  to_notify: z.boolean().optional(),
  description: z.preprocess(blankToUndefined, z.string().max(255).optional()),
  password: z.preprocess(
    blankToUndefined,
    z.string().min(8, { error: 'Password must be at least 8 characters' }).max(100).optional()
  )
})

/**
 * @openapi
 * /api/user/{id}:
 *   put:
 *     summary: Update user
 *     description: Update a user. When user is activated, a confirmation e-mail is sent with a link that allow to choose a password. Only the listed fields are written, any other request body field is ignored. An empty or missing `password` leaves the current password unchanged.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Identifier of the user to be updated.
 *         example: 1
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 description: Set if the user is enabled or not.
 *                 example: true
 *               role:
 *                 type: string
 *                 enum: [user,editor,admin]
 *                 description: Set the new role of the user.
 *                 example: user
 *               to_notify:
 *                 type: boolean
 *                 description: Set if the user receives the notifications of its role.
 *                 example: false
 *               description:
 *                 type: string
 *                 description: Set the user description.
 *                 example: A gancio user
 *               password:
 *                 type: string
 *                 description: Set a new password. Leave it empty to keep the current one.
 *                 example: Passw0rd!
 *     responses:
 *       200:
 *         description: User has been updated.
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/User'
 *       400:
 *         description: The request body is not valid.
 *       401:
 *         description: Unauthorized.
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

  const { success, error, data } = await readValidatedBody(evt, userSchema.safeParse)
  if (!success) {
    throw createError({ status: 400, message: getFirstZodError(error) })
  }

  const user = await User.findByPk(id)
  if (!user) {
    log.error('This user does not exist: ', id)
    throw createError({ status: 404, message: 'This user does not exists' })
  }

  log.info(`Update user ${user.email} - ${JSON.stringify(data)}`)
  if (!user.is_active && data.is_active) {
    enqueueMail(user.email, 'confirm', { user, config: publicSettings }, publicSettings.instance_locale)
  }

  await user.update(data)

  // refetch with the default scope, so the response never carries the password hash
  return User.findByPk(user.id)
})
