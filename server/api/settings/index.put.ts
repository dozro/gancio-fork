import { readBody, defineEventHandler } from 'h3'
import { setSetting } from '~~/server/services'
import { requireAdminSession } from '~~/server/lib/session'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const setting = await readBody(event) // , body => settingSchema.parse(body))
  const result = await setSetting(setting.key, setting.value)
  return result[0].value
})