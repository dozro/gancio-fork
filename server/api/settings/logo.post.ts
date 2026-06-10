import { defineEventHandler, createError } from 'h3'
import type { MultiPartData } from 'h3'
import { parseMultipartFormData, saveUploadedImage } from '~~/server/lib/parseMultipartForm'
import { setSetting } from '~~/server/services'
import { requireAdmin } from '~~/server/lib/auth'

export default defineEventHandler(async (evt) => {
  await requireAdmin(evt)
  const body = await parseMultipartFormData(evt)

  if (!body || !body?.logo) {
    setSetting('logo', undefined)
    throw createError({ status: 200 })
  }

  await saveUploadedImage(body?.logo as MultiPartData, 'custom_logo')
  return setSetting('logo', 'custom_logo.png')
})