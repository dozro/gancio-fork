import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireAdmin } from '~~/server/lib/auth'
import { useLogger } from '~~/server/lib/logger'
import { Collection } from '~~/server/services'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const log = useLogger('collection delete')
  const id = getRouterParam(event, 'id')

  const collection = await Collection.findByPk(id)
  if (!collection) {
    log.error('This collection does not exist: ', id)
    throw createError({ status: 404, message: 'This collection does not exists' })
  }

  return collection.destroy()
})
