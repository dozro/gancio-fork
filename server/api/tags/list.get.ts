import { Event, Tag } from '~~/server/services'
import { fn, col } from '@sequelize/core'

export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  const tags = await Tag.findAll({
    order: [[fn('COUNT', col('tag')), 'DESC']],
    attributes: ['tag', [fn('COUNT', col('tag')), 'count']],
    include: [{ model: Event, where: { is_visible: true }, attributes: [], through: { attributes: [] }, required: true }],
    group: ['tag'],
    raw: true
  })

  return tags
})