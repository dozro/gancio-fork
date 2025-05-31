import { Place, Event } from './sequelize'

export async function getPlaceEvents (id: number) {
  const place = await Place.findByPk(id)
  if (!place) {
      throw new Error(`Place ${id} not found`)
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
  return Event.findAll({ where: { placeId: place.id }})
}