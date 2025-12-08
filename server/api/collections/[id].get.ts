import { getCollectionEvents } from "~~/server/utils/collections"

export default defineEventHandler(evt => {
  // https://github.com/nitrojs/nitro/issues/3518
  const name = getRouterParam(evt, 'id') as string
  return getCollectionEvents({ name })
})
