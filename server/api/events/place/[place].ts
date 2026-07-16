import { createError, defineEventHandler, getRouterParam, getValidatedQuery } from 'h3'
import z from 'zod'
import { handleCache } from '~~/server/lib/API'
import { useLogger } from '~~/server/lib/logger'
import { Place, calculateEtag, getEvents, mapEvents } from '~~/server/services'

const schema = z.object({
  show_recurrent: z.stringbool().optional()
})

/**
 * Return events and past events related to the specified place
 * @return {EventAPI[]}
*/
const log = useLogger('events/place')
export default defineEventHandler(async (evt) => {
  const query = await getValidatedQuery(evt, schema.parse)

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
  const eventsFilters = {
    places: [place.id],
    show_federated: true,
    show_recurrent: query.show_recurrent
  }
  const events = await getEvents(eventsFilters)
  const pastEvents = await getEvents({ ...eventsFilters, older: true, reverse: true })

  const etag = calculateEtag([...events, ...pastEvents, place])
  if (await handleCache(evt, etag)) return
  return {
    events: mapEvents(events),
    pastEvents: mapEvents(pastEvents),
    place
  }
})
