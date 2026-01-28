import { getEvents, mapEvent } from '~~/server/services'

/**
 * Get events created by the current user.
 * @auth
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const events = await getEvents({ user_id: user.id, include_unconfirmed: true })
  return events.map(e => mapEvent(e))
})