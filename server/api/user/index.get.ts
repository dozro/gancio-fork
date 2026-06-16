import { defineEventHandler } from 'h3'
import { requireUser } from '~~/server/lib/auth'

/**
 * @openapi
 * /api/user:
 *   get:
 *     summary: Get current user
 *     description: Get current authenticated user.
 *     responses:
 *       200:
 *         description: The authenticated user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: example@gancio.org
 *                 description:
 *                   type: string
 *                   example: ""
 *                 is_active:
 *                   type: boolean
 *                   example: true
 *                 is_admin:
 *                   type: boolean
 *                   example: false
 *                 createdAt:
 *                   type: string
 *                   example: 2020-01-29T18:10:16.630Z
 *                 updatedAt:
 *                   type: string
 *                   example: 2020-01-30T22:42:14.789Z
 *                 settings:
 *                   type: object
 *                 recover_code:
 *                   type: string
 *                   example: ""
 *       400:
 *         description: Failed to get authenticated user.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Users
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return user
})
