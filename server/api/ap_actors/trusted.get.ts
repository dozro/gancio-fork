export default defineEventHandler(async (event) => {
  const trusted = await APUser.findAll({ where: { trusted: true } })
  const lastModified = getLastModified(trusted)
  if (!handleCacheHeaders(event, { modifiedTime: lastModified, maxAge: 10 })) {
    return trusted.map(t => ({
      ap_id: t.ap_id,
      following: t.following,
      trusted: t.trusted,
      follower: t.follower,
      object: (() => {
        const { publicKey, ...rest } = t.object
        return rest
      })()
    }))
  }
})
