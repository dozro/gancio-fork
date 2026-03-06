import type { WhereOptions } from '@sequelize/core'
import { z } from 'zod'
import { APUser, Instance } from '~~/server/services'

const schema = z.object({
  instance: z.string().optional()
})

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const query = await getValidatedQuery(event, schema.parse)

  const where: WhereOptions<APUser> = {}
  if (query.instance) {
    where.instanceDomain = query.instance
  }

  const users = await APUser.findAll({ where, include: [{ model: Instance, required: true }] })
  return users.map(t => ({
    ap_id: t.ap_id,
    following: t.following,
    trusted: t.trusted,
    blocked: t.blocked,
    follower: t.follower,
    url: t.object.url,
    icon: t.object?.icon?.url,
    name: t.object.name,
    preferredUsername: t.object.preferredUsername,
    summary: t.object.summary,
    domain: t.instance?.domain,
    software: {
      name: t.instance?.data?.software?.name ?? '',
      version: t.instance?.data?.software?.version ?? ''
    }
  }))
})
