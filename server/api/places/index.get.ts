import { Place, Event, publicSettings } from '~~/server/services'
import { Op, fn, col, where } from '@sequelize/core'

import { z } from 'zod'
const schema = z.object({
  query: z.string().optional().transform(q => q?.toLocaleLowerCase(publicSettings.instance_locale)),
  limit: z.number().min(1).max(100).default(10)
})

/**
 * Get a list of places searching by name or address and ordered by event count.
 * Used in autocomplete while selecting a place during event creation.
 * @param query - The query string to search for.
 * @param limit - The maximum number of places to return. (default 10)
 * @returns A list of places.
 */
export default defineEventHandler(async (event) => {
  const { query, limit } = await getValidatedQuery(event, schema.parse)
  const condition = query
    ? {
        [Op.or]: [
          where(fn('LOWER', col('name')), Op.like, '%' + query + '%'),
          where(fn('LOWER', col('address')), Op.like, '%' + query + '%')
        ]
      }
    : undefined

  return Place.findAll({
    order: [[fn('COUNT', col('events.placeId')), 'DESC']],
    where: condition,
    attributes: ['name', 'address', 'latitude', 'longitude', 'id', 'ap_id'],
    include: [{ model: Event, where: { is_visible: true }, required: true, attributes: [] }],
    group: ['Place.id'],
    raw: true,
    limit,
    subQuery: false
  })
})
