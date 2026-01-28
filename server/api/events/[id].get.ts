import { Event, Place, Tag } from '~~/server/services'
import { Op, type WhereOptions } from '@sequelize/core'

export default defineEventHandler(async (evt) => {
  const slug = getRouterParam(evt, 'id')
  const id = Number(slug)
  const where: WhereOptions<Event> = {
    [Op.or]: [
      { slug },
      ...(Number.isInteger(id) ? [{ id }] : [])
    ]
  }
  const event = await Event.findOne({ where, include: [Tag, Place] })
  if (event) {
    return event
  } else {
    throw createError({ status: 404, message: 'Not found' })
  }
})