import { z } from 'zod'
import { unfollowActor } from '~~/server/federation/helpers'
import { APUser } from '~~/server/services'

const schema = z.object({
  ap_id: z.string()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)

  const ap_actor = await APUser.findByPk(body.ap_id) // , { include: Instance })
  if (!ap_actor || !ap_actor.trusted) {
    throw createError({ status: 404, message: 'This ap user does not exists or not trusted' })
  }

  if (ap_actor.following) {
    // unfollow
    await unfollowActor(ap_actor).catch(() => { })
  }

  // remove trust
  await ap_actor.update({ trusted: false })
})