import { exportICS } from '~~/server/services/ics'
import { exportFeed } from '~~/server/services/rss'
import { getLastModified, publicSettings } from '~~/server/services'
import { formatSchema } from '~~/server/types/validator'
import { useLogger } from '~~/server/lib/logger'
import { calculateEtag, eventQuerySchema, getEvents, mapEvents } from '~~/server/services/events'
import { getCollectionEvents } from '~~/server/services/collections'

/**
 * Return events in different formats: rss, ics, json
 *
 */
export default defineCachedEventHandler(async (evt) => {
  const log = useLogger('feed events')
  const { format } = await getValidatedRouterParams(evt, formatSchema.parse)

  const opt = await getValidatedQuery(evt, eventQuerySchema.parse)

  let events
  if (publicSettings.collection_in_home && !(opt.tags || opt.places || opt.query)) {
    log.debug('get collection events', publicSettings.collection_in_home)
    events = await getCollectionEvents({ name: publicSettings.collection_in_home, ...opt })
  } else {
    events = await getEvents(opt)
  }

  const lastModified = getLastModified(events)
  const etag = calculateEtag(events)

  if (handleCacheHeaders(evt, { modifiedTime: lastModified, etag, maxAge: 60, cacheControls: ['stale-with-revalidate'] })) {
    return
  }

  switch (format) {
    case 'rss':
      return exportFeed(evt, events)
    case 'ics':
      return exportICS(evt, events)
    case 'json':
      return mapEvents(events)
    // case 'json-ld':
    //   return mapEventsJSONLD(events)
  }
  throw createError({ status: 400, message: 'Please specify a valid format: rss, feed, ics or json' })
})