import { Message, Event } from "~~/server/utils/sequelize"

export default defineEventHandler(async evt => {
  const log = useLogger('event')
  await requireAdminSession(evt)
  const eventId = evt.context.params?.event_id
  const event = await Event.findByPk(eventId)
  if (!event) {
    throw createError({ status: 400 })
  }
  const body = await readBody(evt)
  return Message.create({ ...body, eventId: event.id })
})