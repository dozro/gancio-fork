export default defineEventHandler(async event => {
  await requireAdminSession(event)
  const log = useLogger('collection moveup')
  const id = Number(getRouterParam(event, 'id'))

  const collection = await Collection.findByPk(id)
  if (!collection) {
    throw createError({ status: 404 })
  }

  await collection.update({ isTop: !collection.isTop })
  return !collection.isTop

})