import { defineEventHandler, getRouterParam } from 'h3'
import { Collection } from '~~/server/services'
import { requireAdminSession } from '~~/server/lib/session'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const id = getRouterParam(event, 'id')

  const collection = await Collection.findByPk(id)
  if (!collection) {
    throw createError({ statusCode: 404 })
  }

  await collection.update({ isTop: !collection.isTop })
  return !collection.isTop
})
