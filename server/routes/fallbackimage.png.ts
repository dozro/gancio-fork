
import { createReadStream, existsSync, statSync } from 'fs'
import path from 'path'
import { get as getConfig } from '../config'
import mime from 'mime-types'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const logoPath = path.resolve(config.upload_path, 'fallbackimage.svg')
  if (!existsSync(logoPath)) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  // TODO: this could be done on upload once for all (optimization)
  const mimeType = mime.lookup(logoPath) || 'application/octet-stream'
  setHeader(event, 'Content-Type', mimeType)

  const stats = statSync(logoPath)
  
  stats.mtime.setMilliseconds(0)
  if (!handleCacheHeaders(event, { modifiedTime: stats.mtime, maxAge: 1000 })) {
    return sendStream(event, createReadStream(logoPath))
  }
})
