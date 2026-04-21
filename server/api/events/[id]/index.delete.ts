import { defineEventHandler, createError, getRouterParam } from 'h3'
import { useLogger } from '~~/server/lib/logger'
import { requireAdminSession } from '~~/server/lib/session'
import { Event } from '~~/server/services'

export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  const log = useLogger('event delete')
  const id = getRouterParam(evt, 'id')

  const event = await Event.findByPk(id)
  if (!event) {
    log.error('This event does not exist: ', id)
    throw createError({ status: 404, message: 'This event does not exists' })
  }

  // TODO: I cannot phisically remove the item as I need it to send the notification!
  // notifyEvent('Delete', event.id)
  return event.destroy()
})