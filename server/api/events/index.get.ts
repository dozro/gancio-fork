import { eventQuerySchema, sendEvents } from "~~/server/utils/events"

/**
* Get events
* Method to search for events with pagination and filtering
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
  const opt = await getValidatedQuery(event, eventQuerySchema.parse)
  if (publicSettings.collection_in_home) {
    log.debug('get collection events', publicSettings.collection_in_home)
    return sendEvents(event, await getCollectionEvents({
      name: publicSettings.collection_in_home,
      ...opt
    }))
  }

  const events = await getEvents(opt)
  return sendEvents(event, events)
})