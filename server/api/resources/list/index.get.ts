import { defineEventHandler, getValidatedQuery } from 'h3'
import { Resource } from '~~/server/services'
import { requireAdminSession } from '~~/server/lib/session'

import z from 'zod'
import type { Paginated } from '~~/server/types/pagination'
import type { WhereOptions } from '@sequelize/core'
import { fn, Op, sql, where } from '@sequelize/core'
import { jsonPath } from '~~/server/services/db'

const schema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(5).max(50).default(15),
  query: z.string().optional()
})

/**
 * Get all resources
 * @auth admin
 */
export default defineEventHandler(async (evt): Promise<Paginated<Resource>> => {
  await requireAdminSession(evt)
  const params = await getValidatedQuery(evt, schema.parse)

  const andWhere: WhereOptions<Resource> = []

  if (params.query) {
    andWhere.push({
      [Op.or]: [
        where(fn('LOWER', jsonPath('data', ['content'])), Op.like, '%' + params.query + '%'),
        where(fn('LOWER', sql.attribute('apUserApId')), Op.like, '%' + params.query + '%'),
        where(fn('LOWER', sql.attribute('$event.title$')), Op.like, '%' + params.query + '%')
      ]
    })
  }

  const result = await Resource.findAndCountAll({
    include: [
      { association: 'APUser', attributes: ['ap_id', 'object', 'blocked'] },
      { association: 'event', attributes: ['id', 'title', 'slug'] }
    ],
    where: andWhere,
    offset: (params.page - 1) * params.pageSize,
    limit: params.pageSize,
    order: [['createdAt', 'DESC']]
  })

  return {
    data: result.rows,
    count: result.count,
    totalPages: Math.ceil(result.count / params.pageSize)
  }
})
