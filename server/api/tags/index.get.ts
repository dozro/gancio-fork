import { defineEventHandler, getValidatedQuery } from 'h3'
import { Event, Tag } from '~~/server/services'
import { Op, fn, col, where } from '@sequelize/core'

import { z } from 'zod'
import { useLogger } from '~~/server/lib/logger'
import { normalizeTag } from '~~/server/services/tags'

const schema = z.object({
  query: z.string().trim().optional().transform(q => q && normalizeTag(q))
})

export default defineEventHandler(async (event) => {
  const log = useLogger('api:tags')  
  const { query } = await getValidatedQuery(event, schema.parse)

  const tags = await Tag.findAll({
    order: [[fn('COUNT', col('tag')), 'DESC']],
    attributes: ['tag', 'normalizedTag', [fn('COUNT', col('tag')), 'count']],
    where: query
      ? { normalizedTag: { [Op.like]: `%${query}%` } }
      : undefined,
    include: [{ model: Event, where: { is_visible: true }, attributes: [], through: { attributes: [] }, required: true }],
    group: ['tag'],
    limit: 10,
    raw: true,
    subQuery: false
  })

  
  const ret = tags.map(t => t.tag)
  console.error(ret)
  return ret
})