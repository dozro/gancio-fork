import { useLogger } from '~~/server/lib/logger'
import { Event, publicSettings, User } from '~~/server/services'

/**
 * disable the author of specified event
 */
export default defineEventHandler(async (evt) => {
  const log = useLogger('event:disable_author')
  const id = getRouterParam(evt, 'id')
  if (!publicSettings.enable_moderation) {
    log.warn('Cannot disable author, moderation is not enabled (eventId: %d)', id)
    throw createError({ statusCode: 403 })
  }

  await requireSessionRole(evt, ['editor', 'admin'])
  const event = await Event.findByPk(id, { include: [{ model: User, required: true }] })
  if (!event) {
    log.warn(`Not found ${id}`)
    throw createError({ statusCode: 404 })
  }

  return event.user.update({ is_active: false })
})