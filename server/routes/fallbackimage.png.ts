
import fs from 'fs'
import path from 'path'
export default defineEventHandler(async (event) => {
  // TODO: check if we do have custom fallback image
  // TODO: send cache header?
  let filePath = path.resolve('public/fallbackimage.svg')
  if (publicSettings.fallbackimage) {
    filePath = publicSettings.fallbackimage
  } else {
    setHeader(event, 'Content-Type', 'image/svg+xml')
  }
  return sendStream(event, fs.createReadStream(filePath))
})