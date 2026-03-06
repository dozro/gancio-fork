import { setSetting } from '~~/server/services'
export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const setting = await readBody(event) // , body => settingSchema.parse(body))
  const result = await setSetting(setting.key, setting.value)
  return result[0].value
})