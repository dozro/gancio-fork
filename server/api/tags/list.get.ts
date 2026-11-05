import { defineEventHandler } from 'h3'
import { Event, Tag } from '~~/server/services'
import { fn, col } from '@sequelize/core'
import { requireAdmin } from '~~/server/lib/auth'

/**
 * @openapi
 * /api/tags/list:
 *   get:
 *     summary: List tags
 *     description: List all tags of visible events with their event count. Admin role is required.
 *     responses:
 *       200:
 *         description: List of tags.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tag:
 *                     type: string
 *                     description: Tag text.
 *                     example: concert
 *                   count:
 *                     type: integer
 *                     description: Number of events with this tag.
 *                     example: 4
 *       401:
 *         description: Unauthorized.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Tags
 */
export default defineEventHandler(async (evt) => {
  await requireAdmin(evt)
  const tags = await Tag.findAll({
    order: [[fn('COUNT', col('tag')), 'DESC']],
    attributes: ['tag', [fn('COUNT', col('tag')), 'count']],
    include: [{ model: Event, where: { is_visible: true }, attributes: [], through: { attributes: [] }, required: true }],
    group: ['tag'],
    raw: true
  })

  return tags
})