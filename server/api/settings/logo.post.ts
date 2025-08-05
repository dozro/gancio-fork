import { parseMultipartFormData, saveUploadedImage } from "~~/server/utils/parseMultipartForm"
import { MultiPartData } from "h3"

export default defineEventHandler(async evt => {
  const log = useLogger('New LOGO')
  await requireAdminSession(evt)
  const body = await parseMultipartFormData(evt)
  if (!body) {
    throw createError({ status: 400 })
  }
  
  if (!body?.logo) {
    throw createError({ status: 400 })
  }
  const path = await saveUploadedImage(body?.logo as MultiPartData, 'logo')
  setSetting('logo', path)
  return 
  
})