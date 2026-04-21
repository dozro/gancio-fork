import { createError, defineEventHandler, getRouterParam } from 'h3'
import { handleCache } from '~~/server/lib/API'
import { useLogger } from '~~/server/lib/logger'
import { Place, calculateEtag, getEvents, mapEvents } from '~~/server/services'
/**
 * Return events and past events related to the specified place
 * @return {EventAPI[]}
*/
const log = useLogger('events/place')
export default defineEventHandler(async (evt) => {
  const nameOrId = getRouterParam(evt, 'place')
  if (!nameOrId) {
    throw createError({ statusCode: 400, message: `Invalid place parameter` })
  }
  const id = Number(nameOrId)
  const place = !isNaN(id) && Number.isInteger(id)
    ? await Place.findByPk(id)
    : await Place.findOne({ where: { name: nameOrId } })
  if (!place) {
    throw createError({ statusCode: 404, message: `Place not found` })
  }

  log.debug(`Events for place: ${place.name}`)
  // place.address = addressToString(place.address)
  const events = await getEvents({ places: [place.id], show_federated: true })
  const pastEvents = await getEvents({ places: [place.id], older: true, reverse: true, show_federated: true })
  const etag = calculateEtag([...events, ...pastEvents, place])
  if (await handleCache(evt, etag)) return
  return { events: mapEvents(events), pastEvents: mapEvents(pastEvents), place }
})