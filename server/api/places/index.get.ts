import { getValidatedQuery, defineEventHandler } from 'h3'
import { z } from 'zod'
import { Op, fn, col, where } from '@sequelize/core'
import { Place, Event } from '~~/server/services'

import { placeToJSON } from '~~/server/services/places'
const schema = z.object({
  query: z.string().toLowerCase().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10)
})

/**
 * @openapi
 * /api/places:
 *   get:
 *     summary: Search places
 *     description: Search places with visible events by name or address, ordered by event count.
 *       Used to autocomplete the place while adding an event.
 *     parameters:
 *       - name: query
 *         in: query
 *         description: Text to search in place name or address.
 *         required: false
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         description: Maximum number of places.
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: List of places.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PlaceAPI'
 *       400:
 *         description: Validation error.
 *     tags:
 *       - Places
 */
export default defineEventHandler(async (event) => {
  const { query, limit } = await getValidatedQuery(event, schema.parse)
  const condition = query
    ? {
        [Op.or]:
        [
          where(fn('LOWER', col('name')), Op.like, '%' + query + '%'),
          where(fn('LOWER', col('address')), Op.like, '%' + query + '%')
        ]
      }
    : undefined

  const places = await Place.findAll({
    order: [[fn('COUNT', col('events.placeId')), 'DESC']],
    where: condition,
    attributes: ['name', 'address', 'latitude', 'longitude', 'id', 'ap_id'],
    include: [{ model: Event, where: { is_visible: true }, required: true, attributes: [] }],
    group: ['Place.id'],
    limit,
    subQuery: false
  })

  return places.map(placeToJSON)
})
