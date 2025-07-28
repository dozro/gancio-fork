export default defineEventHandler(async event => {
  const log = useLogger('filter list')
  const collectionId = getRouterParam(event, 'collection_id')
  return Filter.findAll({ where: { collectionId }})
})
