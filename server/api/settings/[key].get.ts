export default defineEventHandler(async evt => {
  await requireAdminSession(evt)
  const key = getRouterParam(evt, 'key') as keyof Settings
  if (key && typeof publicSettings[key] != 'undefined') {
    if (!handleCacheHeaders(evt, { modifiedTime: publicSettingsLastModified[key] })) {
      return publicSettings[key]
    }
  } else {
    throw createError({ status: 404 })
  }
})
