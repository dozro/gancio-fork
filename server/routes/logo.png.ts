import fs from 'fs'
import path from 'path'
import mime from 'mime-types'
import config from '../config'

export default defineEventHandler(async (event) => {
  const logoPath = path.resolve(config.upload_path, 'logo.png')
  const mimeType = mime.lookup(logoPath) || 'application/octet-stream'
  setHeader(event, 'Content-Type', mimeType)
  
  const stats = fs.statSync(logoPath)
  const lastModified = stats.mtime.toUTCString()
  const etag = `"${stats.size}-${Number(stats.mtimeMs).toString(16)}"`
  setHeader(event, 'Last-Modified', lastModified)
  setHeader(event, 'ETag', etag)
  
  return sendStream(event, fs.createReadStream(logoPath))
})