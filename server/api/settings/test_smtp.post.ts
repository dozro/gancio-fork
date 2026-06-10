import { defineEventHandler, createError, readBody } from 'h3'
import { sendMail, publicSettings, setSetting } from '~~/server/services'
import { requireAdmin } from '~~/server/lib/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const setting = await readBody(event)
  await setSetting('smtp', setting)
  try {
    sendMail(publicSettings.admin_email, 'test')
  } catch (e) {
    throw createError({ statusCode: 400, statusMessage: String(e) })
  }
})