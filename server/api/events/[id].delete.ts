import { Event } from "#imports"

export default defineEventHandler(async evt => {
  await requireAdminSession(evt)
  const log = useLogger('event delete')
  const id = getRouterParam(evt, 'id')

  const event = await Event.findByPk(id)
  if (!event) {
    log.error('This event does not exist: ', id)
    throw createError({ status: 404, message: 'This event does not exists' })
  }

  return event.destroy()
})
