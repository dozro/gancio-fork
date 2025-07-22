import { Event, Place, Tag, Message } from "~~/server/utils/sequelize"

export default defineEventHandler(async (evt) => {
  const eventId = evt.context.params?.event_id
  const event = await Event.findByPk(eventId, { include: [Message] })
  if (!event) {
    throw createError({ status: 400 })
  }
  return event.messages
})
