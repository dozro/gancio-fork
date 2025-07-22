import { z } from "zod"
// import { APUser } from "#imports"
// import { APUser } from "~/server/utils/sequelize"
// import { unfollowActor } from "~/server/federation/helpers"
import { unfollowActor } from "~~/server/federation/helpers"

const schema = z.object({
  ap_id: z.string()
})

export default defineEventHandler(async event => {
  const log = useLogger('AP trust')
  const body = await readValidatedBody(event, schema.parse)

  const ap_actor = await APUser.findByPk(body.ap_id) //, { include: Instance })
  if (!ap_actor) {
    throw createError({ status: 404, message: 'This ap user does not exists' })
  }

  if (ap_actor.following) {
    // unfollow
    await unfollowActor(ap_actor).catch(e => {})
  }

  // remove trust
  await ap_actor.update({ trusted: false })
})
