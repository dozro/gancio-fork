import { readBody, defineEventHandler } from 'h3'
import { setSetting } from '~~/server/services'
import { requireAdmin } from '~~/server/lib/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const setting = await readBody(event) // , body => settingSchema.parse(body))
  const result = await setSetting(setting.key, setting.value)
  return result[0].value
})