import { eventHandler } from 'h3'
import { getLegacyUserSession, getUserSession } from '~~/server/lib/session'

export default eventHandler(async (event) => {
  let user = await getUserSession(event)

  if (!user) {
    user = await getLegacyUserSession(event)
  }

  return user
})