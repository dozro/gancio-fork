import { z } from "zod"
import { APUser } from "~/server/utils/sequelize"
import { followActor, unfollowActor } from '~/server/federation/helpers'
const schema = z.object({
  ap_id: z.string()
})

export default defineEventHandler(async event => {
  
  // authenticate
  // await requireAdminSession(event)

  const log = useLogger('follow')
  const body = await readValidatedBody(event, schema.parse)

  const ap_actor = await APUser.findByPk(body.ap_id) //, { include: Instance })
  if (!ap_actor) {
    throw createError({ status: 404, message: 'This ap user does not exists' })
  }

  if (ap_actor.following) {
    await unfollowActor(ap_actor)
  } else {
    await followActor(ap_actor)
  }
  
})