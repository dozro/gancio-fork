import { handleCache } from '~~/server/lib/API'
import { useLogger } from '~~/server/lib/logger'
import { Tag, calculateEtag, getEvents, mapEvents } from '~~/server/services'

export default defineEventHandler(async (evt) => {
  const log = useLogger('events/tag')
  const tagName = getRouterParam(evt, 'tag', { decode: true })

  if (!tagName) {
    log.warn('Tag not specified')
    throw createError({ statusCode: 404, statusMessage: 'Tag not specified' })
  }

  const tag = await Tag.findByPk(tagName)
  if (!tag) {
    log.warn('Tag not found', tagName)
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  const events = await getEvents({ tags: [tagName], show_federated: true })
  const pastEvents = await getEvents({ tags: [tagName], show_federated: true, older: true, reverse: true })

  const etag = calculateEtag([...events, ...pastEvents])
  if (await handleCache(evt, etag)) return
  return { events: mapEvents(events), pastEvents: mapEvents(pastEvents) }
})