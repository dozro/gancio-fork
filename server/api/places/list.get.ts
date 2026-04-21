import { defineEventHandler } from 'h3'
import { requireAdminSession } from '~~/server/lib/session'
import { fn, col, literal } from '@sequelize/core'
import { Event, Place } from '~~/server/services'
import { placeToJSON } from '~~/server/services/places'

/**
 * List all places with their event count, used in admin panel
 * @auth
 */
export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  const places = await Place.findAll({
    order: [[literal('eventCount'), 'DESC']],
    attributes: ['name', 'address', 'latitude', 'longitude', 'id', 'ap_id',
      [fn('COUNT', col('events.placeId')), 'eventCount']],
    include: [{ model: Event, where: { is_visible: true }, required: true, attributes: [] }],
    group: ['Place.id']
  })
  // return places
  return places.map(placeToJSON)
})
