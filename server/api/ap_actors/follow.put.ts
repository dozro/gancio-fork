import { z } from 'zod'
import { followActor, unfollowActor } from '~~/server/federation/helpers'
import { useLogger } from '~~/server/lib/logger'
import { APUser, Instance } from '~~/server/services'
const schema = z.object({
  ap_id: z.string()
})

export default defineEventHandler(async (event) => {
  // authenticate
  await requireAdminSession(event)

  const log = useLogger('follow')
  const { ap_id } = await readValidatedBody(event, schema.parse)

  const ap_actor = await APUser.findByPk(ap_id, { include: Instance })
  if (!ap_actor) {
    log.warn('This ap user does not exists: ', ap_id)
    throw createError({ status: 404, message: 'This ap user does not exists' })
  }

  if (ap_actor.following) {
    return unfollowActor(ap_actor)
  } else {
    return followActor(ap_actor)
  }
})
