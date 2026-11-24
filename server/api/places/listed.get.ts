import { defineEventHandler } from 'h3'
import { fn, col } from '@sequelize/core'
import { Place, Event } from '~~/server/services'

import { placeToJSON } from '~~/server/services/places'
/**
 * @openapi
 * /api/places/listed:
 *   get:
 *     summary: Get places flagged `listed`
 *     description: Used to populate the /places page
 *     responses:
 *       200:
 *         description: List of places.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PlaceAPI'
 *     tags:
 *       - Places
 */
export default defineEventHandler(async () => {
  const places = await Place.findAll({
    where: { listed: true },
    order: [[fn('COUNT', col('events.placeId')), 'DESC']],
    attributes: ['name', 'address', 'latitude', 'longitude', 'id', 'ap_id', 'listed'],
    include: [{ model: Event, where: { is_visible: true }, required: true, attributes: [] }],
    group: ['Place.id']
  })

  return places.map(placeToJSON)
})
