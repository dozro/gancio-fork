import { getCollectionEvents } from "~~/server/utils/collections"

export default defineEventHandler(evt => {
  const log = useLogger('collection get')
  const name = getRouterParam(evt, 'id')

  return getCollectionEvents({ name })
})