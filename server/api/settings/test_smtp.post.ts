import { defineEventHandler, createError, readBody } from 'h3'
import { sendMail, publicSettings, setSetting } from '~~/server/services'
import { requireAdminSession } from '~~/server/lib/session'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const setting = await readBody(event)
  await setSetting('smtp', setting)
  try {
    sendMail(publicSettings.admin_email, 'test')
  } catch (e) {
    throw createError({ statusCode: 400, statusMessage: String(e) })
  }
})