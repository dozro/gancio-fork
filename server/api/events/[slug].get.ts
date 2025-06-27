import { Event, Place, Tag } from "~/server/utils/sequelize"
import { Op } from '@sequelize/core'

export default defineEventHandler(async event => {
  
  let where: any = { [Op.or]: [{ slug: event.context.params?.slug }] }
  const id = Number(event.context.params?.slug)
  if (!isNaN(id) && Number.isInteger(id)) {
    where[Op.or].push({ id })
  }
  const element = await Event.findOne({ where, include: [Tag, Place] })
    if (element) {
        return element
    } else {
        throw createError({ status: 404, message: 'Not found' })
    }
})
