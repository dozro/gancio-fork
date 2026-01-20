/**
 * Return events and past events related to the specified place
 * @return {EventAPI[]}
*/
const log = useLogger('events/place')
export default defineEventHandler(async (evt) => {
  const nameOrId = getRouterParam(evt, 'place')
  const id = Number(nameOrId)
  const place = !isNaN(id) && Number.isInteger(id)
    ? await Place.findByPk(id)
    : await Place.findOne({ where: { name: nameOrId } })
  if (!place) {
    throw createError({ statusCode: 404, statusMessage: `Place not found` })
  }

  log.debug(`Events for place: ${place.name}`)
  const events = await getEvents({ places: [place.id], show_federated: true })
  const pastEvents = await getEvents({ places: [place.id], older: true, reverse: true, show_federated: true })
  const lastModifiedEvents = getLastModified(events) ?? new Date(0)
  const lastModifiedPastEvents = getLastModified(pastEvents) ?? new Date(0)
  const modifiedTime = lastModifiedEvents > lastModifiedPastEvents ? lastModifiedEvents : lastModifiedPastEvents
  if (!handleCacheHeaders(evt, { modifiedTime, maxAge: 60 })) {
    return { events: mapEvents(events), pastEvents: mapEvents(pastEvents), place }
  }
})
