import { defineEventHandler, getRouterParam } from 'h3'
import { requireAdmin } from '~~/server/lib/auth'
import { useLogger } from '~~/server/lib/logger'
import { Announcement } from '~~/server/services'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const log = useLogger('announcement delete')
  const id = getRouterParam(event, 'id')

  const announcement = await Announcement.findByPk(id)
  if (!announcement) {
    log.error('This announcement does not exist: ', id)
    throw createError({ status: 404, message: 'This announcement does not exists' })
  }

  return announcement.destroy()
})
