import { APUser, Instance } from '~~/server/services'
import { handleCache } from '~~/server/lib/API'

export default defineEventHandler(async (evt) => {
  if (await handleCache(evt, APUser)) return
  const trusted = await APUser.findAll({ where: { trusted: true }, include: [{ model: Instance, required: true }] })
  return trusted.map(t => ({
    ap_id: t.ap_id,
    following: t.following,
    trusted: t.trusted,
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
