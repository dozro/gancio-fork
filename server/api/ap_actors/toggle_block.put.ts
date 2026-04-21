import { defineEventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { requireAdminSession } from '~~/server/lib/session'
import { useLogger } from '~~/server/lib/logger'
import { APUser, Instance } from '~~/server/services'
const schema = z.object({
  ap_id: z.string()
})

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  const log = useLogger('toggle_block')
  const { ap_id } = await readValidatedBody(event, schema.parse)

  const ap_actor = await APUser.findByPk(ap_id, { include: Instance })
  if (!ap_actor) {
    log.warn('This ap user does not exists: ', ap_id)
    throw createError({ status: 404, message: 'This ap user does not exists' })
  }

  await ap_actor.update({ blocked: !ap_actor.blocked })
  log.info(`ap_user "${ap_actor.ap_id}" ${ap_actor.blocked ? 'blocked' : 'unblocked'}`)
})
