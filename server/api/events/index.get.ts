import { defineEventHandler, getValidatedQuery } from 'h3'
import { eventQuerySchema, getEvents, mapEvents } from '~~/server/services/events'
import { Event, publicSettings } from '~~/server/services'
import { useLogger } from '~~/server/lib/logger'
import { getCollectionEvents } from '~~/server/services/collections'
import { enableCors, handleCache } from '~~/server/lib/API'

/**
* Get events
* by default returns upcoming events from now on or of specific collection if collection in home is set
* @param {integer} [start] - start timestamp (default: now)
* @param {integer} [end] - end timestamp (optional)
* @param {string}  [query] - search for this string in title, place or tags
* @param {array} [tags] - List of tags
* @param {array} [places] - List of places id
* @param {boolean} [show_multidate] - Show also multidate events (default: true)
* @param {boolean} [show_recurrent] - Show also recurrent events (default: as choosen in admin settings)
* @param {boolean} [show_federated] - Show federated events too
* @param {integer} [max] - Limit events
* @param {integer} [page] - Pagination
* @param {boolean} [older] - select <= start instead of >=
* @param {boolean} [reverse] - reverse order
* @example
* - [https://demo.gancio.org/api/events](https://demo.gancio.org/api/events)
* - [usage example](https://framagit.org/les/gancio/-/blob/master/webcomponents/src/GancioEvents.svelte#L18-42)
*/
export default defineEventHandler(async (event) => {
  const log = useLogger('get events')
  enableCors(event)
  const opt = await getValidatedQuery(event, eventQuerySchema.parse)
  let events

  if (await handleCache(event, Event)) return

  if (publicSettings.collection_in_home && !(opt.tags || opt.places || opt.query)) {
    log.debug('get collection events', publicSettings.collection_in_home)
    events = await getCollectionEvents({ name: publicSettings.collection_in_home, ...opt })
  } else {
    events = await getEvents(opt)
  }

  return mapEvents(events)
})
