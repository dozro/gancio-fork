import { defineEventHandler } from 'h3'
import { isRole } from '~~/server/lib/auth'
import { Announcement } from '~~/server/services'

/**
 * @openapi
 * /api/announcements/{id}:
 *   get:
 *     summary: Get announcement
 *     description: Get a specific announcement by id. This is used in announcement page.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Id of the announcement to get.
 *         required: true
 *         example: 1
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The announcement with identifier `id`.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       404:
 *         description: Announcement not found or not visible.
 *     tags:
 *       - Announcements
 */
export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (await isRole(event, 'admin')) {
    return Announcement.findOne({ where: { id } })
  } else {
    return Announcement.findOne({ where: { id, visible: true } })
  }
})
