import { Event } from "#imports"

export default defineEventHandler (async evt => {
  const log = useLogger('Event confirm')
  const id = getRouterParam(evt, 'id')
  
  const user = await getUser(evt)
  const event = await Event.findByPk(id)
  
  if (!event) {
    log.warn(`Not found ${id}`)
    throw createError({ status: 404 })
  }
  
  if (!user?.is_editor && !user?.is_admin && user?.id !== event?.userId) {
    log.warn(`Someone not allowed is trying to unconfirm -> "${event.title}`)
    throw createError({ status: 403 })
  }

  await event.update({ is_visible: true })
  
})