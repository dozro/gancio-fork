import { getCollectionEvents } from "~~/server/utils/collections"

export default defineEventHandler(evt => {
  const name = getRouterParam(evt, 'id')
  return getCollectionEvents({ name })
})