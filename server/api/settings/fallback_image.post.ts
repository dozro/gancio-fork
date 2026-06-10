import { defineEventHandler, createError, type MultiPartData } from 'h3'
import { parseMultipartFormData, saveUploadedImage } from '~~/server/lib/parseMultipartForm'
import { setSetting } from '~~/server/services'
import { requireAdmin } from '~~/server/lib/auth'

export default defineEventHandler(async (evt) => {
  await requireAdmin(evt)
  const body = await parseMultipartFormData(evt)

  if (!body || !body?.fallback_image) {
    setSetting('header_image', undefined)
    throw createError({ statusCode: 200 })
  }

  await saveUploadedImage(body?.fallback_image as MultiPartData, 'custom_fallback_image')
  return setSetting('fallback_image', 'custom_fallback_image.png')
})