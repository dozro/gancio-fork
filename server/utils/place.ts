import { Op } from '@sequelize/core'
import { Place, Event } from './sequelize'

export async function getPlaceEvents (nameOrId: number | string) {
  const place = typeof nameOrId === 'number'
    ? await Place.findByPk(nameOrId)
    : await Place.findOne({ where: { name: nameOrId } })
  if (!place) {
      throw new Error(`Place ${nameOrId} not found`)
  }
  
  // const format = req.params.format || 'json'
  // log.debug(`Events for place: ${place.name}`)
  // const events = await eventController._select({ places: String(place.id), show_recurrent: true, show_multidate: true, show_federated: true }) 
  // switch (format) {
  //   case 'rss':
  //     return exportController.feed(req, res, events,
  //         `${res.locals.settings.title} - Place @${place.name}`,
  //         `${res.locals.settings.baseurl}/feed/rss/place/${place.id}`)
  //   case 'ics':
  //     return exportController.ics(req, res, events)
  //   default:
  //     const pastEvents = await eventController._select({ places: String(place.id), show_recurrent: true, show_multidate: true, older: true, reverse: true, show_federated: true }) 
  //     return res.json({ events, pastEvents, place })
  // }
  const events = await Event.findAll({ where: { placeId: place.id }, include: [Place, Tag] })
  return { place, events } as { place: Place, events: Event[] }
}