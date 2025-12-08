export default defineEventHandler(async evt => {
  const key = getRouterParam(evt, 'key') as keyof Settings
  if (key && publicSettings[key]) {
    return handleHttpCache(evt, { data: publicSettings[key], lastModified: publicSettingsLastModified[key] })
  } else {
    throw createError({ status: 404 })
  }
})
