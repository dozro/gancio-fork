import fs from 'fs'
import path from 'path'
export default defineEventHandler(async (event) => {
  // TODO: check if we do have custom fallback image
  // TODO: send cache header?
  const filePath = path.resolve('public/fallbackimage.svg')
  setHeader(event, 'Content-Type', 'image/svg+xml')
  return sendStream(event, fs.createReadStream(filePath))
})