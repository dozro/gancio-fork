import { sendMail } from '~~/server/utils/sendMail'

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
