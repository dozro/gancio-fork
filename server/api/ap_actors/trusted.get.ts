export default defineEventHandler(async (event) => {
  const trusted = await APUser.findAll({ where: { trusted: true } })
  const lastModified = getLastModified(trusted)
  if (!handleCacheHeaders(event, { modifiedTime: lastModified })) {
    return trusted.map(t => ({
      ap_id: t.ap_id,
      object: (() => {
        const { publicKey, ...rest } = t.object
        return rest
      })()
    }))
  }
})
