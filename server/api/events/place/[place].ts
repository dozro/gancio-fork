// import { getPlaceEvents } from "~~/server/utils/place"
/**
* 
*/
import { z } from 'zod'
// const schema = z.object({
//   placeId: z.coerce.number()
// })
const log = useLogger('events / place')
export default defineEventHandler(async evt => {
  const nameOrId = getRouterParam(evt, 'place')
  const { format = 'json' } = getQuery(evt)
  const id = Number(nameOrId)
  const place = !isNaN(id) && Number.isInteger(id)
    ? await Place.findByPk(id)
    : await Place.findOne({ where: { name: nameOrId } })
  if (!place) {
      throw createError({ status: 404, message: `Place not found` })
  }

// const format = req.params.format || 'json'
  log.debug(`Events for place: ${place.name}`)
  // const events = await eventController._select({ places: String(place.id), show_recurrent: true, show_multidate: true, show_federated: true }) 
  const events = await getEvents({ places: [place.id], show_federated: true })
  switch (format) {
    case 'rss':
      return exportFeed(evt, events, `${publicSettings.title} - Place @${place.name}`, `${publicSettings.baseurl}/feed/rss/place/${place.id}`)
    case 'ics':
      return exportICS(evt, events)
    default:
      const pastEvents = await getEvents({ places: [place.id], older: true, reverse: true, show_federated: true })
      return { events, pastEvents, place }
  }
})
