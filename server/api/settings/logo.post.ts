import { parseMultipartFormData, saveUploadedImage } from '~~/server/utils/parseMultipartForm'
import type { MultiPartData } from 'h3'

export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  const body = await parseMultipartFormData(evt)

  if (!body || !body?.logo) {
    setSetting('logo', undefined)
    throw createError({ status: 200 })
  }

  await saveUploadedImage(body?.logo as MultiPartData, 'custom_logo')
  return setSetting('logo', 'custom_logo.png')
})
