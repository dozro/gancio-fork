import max from 'lodash/max'

import { calculateEtag } from '~~/server/utils/events'
export default defineEventHandler(async evt => {
  const log = useLogger('events/tag')
  const tagName = getRouterParam(evt, 'tag')

  if (!tagName) {
    log.warn('Tag not specified')
    throw createError({ statusCode: 404, statusMessage: 'Tag not specified' })
  }

  const tag = await Tag.findByPk(tagName)
  if (!tag) {
    log.warn('Tag not found')
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  const events = await getEvents({ tags: [tagName], show_federated: true })
  const pastEvents = await getEvents({ tags: [tagName], show_federated: true, older: true, reverse: true })

  const lastModifiedPastEvents = getLastModified(pastEvents)
  const lastModifiedEvents = getLastModified(events)
  const etag = calculateEtag(events)
  const modifiedTime = max([lastModifiedEvents, lastModifiedPastEvents])
  if (!handleCacheHeaders(evt, { modifiedTime, etag, maxAge: 5 })) {
    return { events: mapEvents(events), pastEvents: mapEvents(pastEvents) }
  }

})