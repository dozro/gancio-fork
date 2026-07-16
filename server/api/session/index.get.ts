import { eventHandler } from 'h3'
import { getLegacyUserSession, getUserSession } from '~~/server/lib/session'

/**
 * @openapi
 * /api/session:
 *   get:
 *     summary: Get session user
 *     description: Get user of the current session.
 *     responses:
 *       200:
 *         description: The user session.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       204:
 *         description: No session.
 *     tags:
 *       - Session
 */
export default eventHandler(async (event) => {
  let user = await getUserSession(event)

  if (!user) {
    user = await getLegacyUserSession(event)
  }

  return user
})