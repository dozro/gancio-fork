import { Event, Place, Tag } from "~~/server/utils/sequelize"
import { Op } from '@sequelize/core'

export default defineEventHandler(async evt => {
  const log = useLogger('event details!')
  const slug = getRouterParam(evt, 'id')
  let where: any = { [Op.or]: [{ slug }] }
  const id = Number(slug)
  if (!isNaN(id) && Number.isInteger(id)) {
    where[Op.or].push({ id })
  }
  const event = await Event.findOne({ where, include: [Tag, Place] })
    if (event) {
      return event
    } else {
        throw createError({ status: 404, message: 'Not found' })
    }
})
