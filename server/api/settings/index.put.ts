export default defineEventHandler(async event => {
  await requireAdminSession(event)
  const setting = await readBody(event) //, body => settingSchema.parse(body))
  return setSetting(setting.key, setting.value)
})