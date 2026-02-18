import { APUser, calculateEtag, getLastModified, Instance } from '~~/server/services'
export default defineEventHandler(async (event) => {
  const trusted = await APUser.findAll({ where: { trusted: true }, include: [{ model: Instance, required: true }] })
  // const lastModified = getLastModified(trusted)
  // const etag = calculateEtag(trusted.map(t => ({ id: t.ap_id, updatedAt: t.updatedAt })))
  // handleCacheHeaders(event, { etag, modifiedTime: lastModified, cacheControls: ['must-revalidate'] })
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
