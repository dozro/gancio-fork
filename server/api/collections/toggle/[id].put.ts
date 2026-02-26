import { Collection } from '~~/server/services'

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
