import { announceEvent } from '~~/server/federation/helpers'
import { useLogger } from '~~/server/lib/logger'
import { Event, Place } from '~~/server/services'
import { canModifyEvent } from '~~/server/services/events'

export default defineEventHandler(async (evt) => {
  const log = useLogger('Event reannounce')
  const id = getRouterParam(evt, 'id')

  const user = await requireUser(evt)
  const event = await Event.findByPk(id, { include: [{ model: Place }] })

  if (!event) {
    log.warn(`Not found ${id}`)
    throw createError({ status: 404 })
  }

  if (!canModifyEvent(event, user)) {
    log.warn(`Someone not allowed is trying to unconfirm -> "${event.title}`)
    throw createError({ status: 403 })
  }

  await announceEvent(event)
})
