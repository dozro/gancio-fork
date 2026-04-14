import { useLogger } from '~~/server/lib/logger'
import { Event, Place, Tag } from '~~/server/services'
import { eventToAP } from '~~/server/services/events'

export default defineEventHandler(async (evt) => {
  // const { preferHTML } = await import('./helpers')
  const log = useLogger('') // Assuming you have a logger composable or utility
  const id = Number(getRouterParam(evt, 'id'))
  log.debug('[FEDI] Get event')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Bad request.' })
  }

  // if (preferHTML(event)) {
  //   return sendRedirect(event, `/place/${id}`, 302)
  // }

  const event = await Event.findByPk(id, { include: [Place, Tag] })
  if (!event) {
    log.warn(`[FEDI] Place ${id} not found`)
    return sendError(evt, createError({ statusCode: 404, statusMessage: 'Not found.' }))
  }

  setHeader(evt, 'Content-Type', 'application/activity+json; charset=utf-8')
  return eventToAP(event)
})
