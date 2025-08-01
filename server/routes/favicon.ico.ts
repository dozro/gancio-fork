import fs from 'fs'
import path from 'path'
import mime from 'mime-types'

export default defineEventHandler(async (event) => {
  const filePath = path.resolve(publicSettings?.logo ?? 'public/logo.png')

  const mimeType = mime.lookup(filePath) || 'application/octet-stream'
  setHeader(event, 'Content-Type', mimeType)
  
  const stats = fs.statSync(filePath)
  const lastModified = stats.mtime.toUTCString()
  const etag = `"${stats.size}-${Number(stats.mtimeMs).toString(16)}"`
  setHeader(event, 'Last-Modified', lastModified)
  setHeader(event, 'ETag', etag)
  
  if (!handleHttpCache(event, { updatedAt: stats.mtime })) {
    return sendStream(event, fs.createReadStream(filePath))
  } else {
    return 'cache'
  }
})