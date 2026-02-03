import { useLogger } from '~~/server/lib/logger'
import { Event } from '~~/server/services'
import { canModifyEvent } from '~~/server/services/events'

/**
 * toggle event confirmation status
 * note that this could be called by an editor, an admin or the event owner
 * @auth
 */
export default defineEventHandler(async (evt) => {
  const log = useLogger('Event toggle confirmation')
  const id = getRouterParam(evt, 'id')

  const user = await requireUser(evt)
  const event = await Event.findByPk(id)

  if (!event) {
    log.warn(`Not found ${id}`)
    throw createError({ statusCode: 404 })
  }

  if (!canModifyEvent(event, user)) {
    log.warn(`Someone not allowed is trying to ${event.is_visible ? 'unconfirm' : 'confirm'} -> "${event.title}`)
    throw createError({ statusCode: 403 })
  }

  return event.update({ is_visible: !event.is_visible })
})
