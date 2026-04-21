import { defineEventHandler, createError } from 'h3'
import type { MultiPartData } from 'h3'
import { parseMultipartFormData, saveUploadedImage } from '~~/server/lib/parseMultipartForm'
import { setSetting } from '~~/server/services'
import { requireAdminSession } from '~~/server/lib/session'

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