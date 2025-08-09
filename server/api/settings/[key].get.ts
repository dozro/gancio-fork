export default defineEventHandler (async evt => {
  const key = getRouterParam(evt, 'key') as keyof Settings
  if (key && publicSettings[key]) {
      return publicSettings[key]
  } else {
    throw createError({ status: 404 })
  }
})