import { defineEventHandler } from 'h3'
import { getEvents, mapEvent } from '~~/server/services'
import { requireUser } from '~~/server/lib/session'
/**
 * Get events created by the current user.
 * @auth
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const events = await getEvents({ mine: true, include_unconfirmed: true }, user)
  return events.map(e => mapEvent(e))
})
