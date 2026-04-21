import { defineEventHandler, createError, type MultiPartData } from 'h3'
import { parseMultipartFormData, saveUploadedImage } from '~~/server/lib/parseMultipartForm'
import { setSetting } from '~~/server/services'
import { requireAdminSession } from '~~/server/lib/session'

export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  const body = await parseMultipartFormData(evt)
  console.error(body)
  if (!body || !body?.header_image) {
    setSetting('header_image', undefined)
    throw createError({ statusCode: 200 })
  }

  await saveUploadedImage(body?.header_image as MultiPartData, 'custom_header_image')
  return setSetting('header_image', 'custom_header_image.png')
})