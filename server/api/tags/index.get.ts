import { defineEventHandler, getValidatedQuery } from 'h3'
import { Event, Tag } from '~~/server/services'
import { Op, fn, col } from '@sequelize/core'

import { z } from 'zod'
import { normalizeTag } from '~~/server/services/tags'

const schema = z.object({
  query: z.string().trim().optional().transform(q => q && normalizeTag(q))
})

/**
 * @openapi
 * /api/tags:
 *   get:
 *     summary: Search tags
 *     description: Search up to 10 tags of visible events, ordered by event count. Used to autocomplete tags while adding an event.
 *     parameters:
 *       - name: query
 *         in: query
 *         description: Text to search in the normalized tag.
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tags.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example:
 *                 - concert
 *                 - jazz
 *     tags:
 *       - Tags
 */
export default defineEventHandler(async (event) => {
  const { query } = await getValidatedQuery(event, schema.parse)
  const tags = await Tag.findAll({
    order: [[fn('COUNT', col('tag')), 'DESC']],
    attributes: ['tag'],
    where: query
      ? { normalizedTag: { [Op.like]: `%${query}%` } }
      : undefined,
    include: [{ model: Event, where: { is_visible: true }, attributes: [], through: { attributes: [] }, required: true }],
    group: ['tag'],
    limit: 10,
    raw: true,
    subQuery: false
  })

  return tags.map(t => t.tag)
})