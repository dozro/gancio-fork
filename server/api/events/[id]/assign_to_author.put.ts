import { useLogger } from '~~/server/lib/logger'
import { Event } from '~~/server/services'

/**
 * assign an anonymous event to author
 * note that this could be called by an editor or an admin
 * @auth
 */
export default defineEventHandler(async (evt) => {
  const log = useLogger('event:assign_to_author')
  const id = getRouterParam(evt, 'id')

  await requireSessionRole(evt, ['editor', 'admin'])
  const event = await Event.findByPk(id)
  if (!event) {
    log.warn(`Not found ${id}`)
    throw createError({ statusCode: 404 })
  }

  const { userId } = await readBody(evt)
  return event.update({ userId })
})