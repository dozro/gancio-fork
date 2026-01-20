import { Event } from '#imports'
import { announceEvent } from '~~/server/federation/helpers'

export default defineEventHandler (async (evt) => {
  const log = useLogger('Event reannounce')
  const id = getRouterParam(evt, 'id')

  const user = await requireUser(evt)
  const event = await Event.findByPk(id, { include: [{ model: Place }] })

  if (!event) {
    log.warn(`Not found ${id}`)
    throw createError({ status: 404 })
  }

  if (!user?.is_editor && !user?.is_admin && user?.id !== event?.userId) {
    log.warn(`Someone not allowed is trying to unconfirm -> "${event.title}`)
    throw createError({ status: 403 })
  }

  await announceEvent(event)
})
