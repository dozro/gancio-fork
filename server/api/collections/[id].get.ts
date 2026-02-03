import { sendEvents } from '~~/server/services'
import { getCollectionEvents } from '~~/server/services/collections'

export default defineEventHandler(async (evt) => {
  // https://github.com/nitrojs/nitro/issues/3518
  const name = getRouterParam(evt, 'id', { decode: true }) as string
  return sendEvents(evt, await getCollectionEvents({ name }))
})
