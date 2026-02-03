import { Place, Event } from '~~/server/services'
import { Op, fn, col, where } from '@sequelize/core'

import { z } from 'zod'
const schema = z.object({
  query: z.string().optional().transform(q => q?.toLocaleLowerCase())
})

export default defineEventHandler(async (event) => {
  const { query } = await getValidatedQuery(event, schema.parse)

  if (!query) {
    return Place.findAll({
      order: [[fn('COUNT', col('events.placeId')), 'DESC']],
      include: [{ model: Event, where: { is_visible: true }, required: true, attributes: [] }],
      group: ['Place.id'],
      raw: true
    })
  } else {
    return Place.findAll({
      order: [[fn('COUNT', col('events.placeId')), 'DESC']],
      where: {
        [Op.or]: [
          where(fn('LOWER', col('name')), Op.like, '%' + query + '%'),
          where(fn('LOWER', col('address')), Op.like, '%' + query + '%')
        ]
      },
      attributes: ['name', 'address', 'latitude', 'longitude', 'id', 'ap_id'],
      include: [{ model: Event, where: { is_visible: true }, required: true, attributes: [] }],
      group: ['Place.id'],
      raw: true,
      limit: 10,
      subQuery: false
    })
  }
})