import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { requireAdmin } from '~~/server/lib/auth'
import { useLogger } from '~~/server/lib/logger'
import { Filter } from '~~/server/services'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const log = useLogger('Filter put')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const filter = await Filter.findByPk(id)
  if (!filter) {
    log.error('This filter does not exist: ', id)
    throw createError({ status: 404, message: 'This filter does not exists' })
  }

  return filter.update(body)
})