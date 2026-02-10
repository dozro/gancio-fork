import { getEvents, mapEvent } from '~~/server/services'

/**
 * Get events created by the current user.
 * @auth
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const events = await getEvents({ mine: true, include_unconfirmed: true }, user)
  return events.map(e => mapEvent(e))
})
