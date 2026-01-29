import { useLogger } from '~~/server/lib/logger'
import { Event } from '~~/server/services'
import { eventToAP } from '~~/server/services/events'

export default defineEventHandler(async (evt) => {
  // const { preferHTML } = await import('./helpers')
  const log = useLogger('') // Assuming you have a logger composable or utility
  const id = getRouterParam(evt, 'id')
  log.debug('[FEDI] Get event')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Bad request.' })
  }

  // if (preferHTML(event)) {
  //   return sendRedirect(event, `/place/${id}`, 302)
  // }

  const event = await Event.findByPk(id)
  if (!event) {
    log.warn(`[FEDI] Place ${id} not found`)
    return sendError(evt, createError({ statusCode: 404, statusMessage: 'Not found.' }))
  }

  const ret = eventToAP(event)
  // ret['@context'] = ['https://www.w3.org/ns/activitystreams']
  setHeader(evt, 'Content-Type', 'application/activity+json; charset=utf-8')
  return ret
})
