import { parseMultipartFormData, saveUploadedImage } from "~~/server/utils/parseMultipartForm"
import { MultiPartData } from "h3"

export default defineEventHandler(async evt => {
  await requireAdminSession(evt)
  const body = await parseMultipartFormData(evt)
  
  if (!body || !body?.fallback_image) {
    setSetting('header_image', undefined)
    throw createError({ statusCode: 200 })
  }
  
  await saveUploadedImage(body?.fallback_image as MultiPartData, 'custom_fallback_image')
  return setSetting('fallback_image', 'custom_fallback_image.png')
})