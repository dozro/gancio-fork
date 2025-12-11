
import fs from 'fs'
import path from 'path'
import { get as getConfig } from '../config'
import mime from 'mime-types'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const logoPath = path.resolve(config.upload_path, 'fallbackimage.svg')

  // TODO: this could be done on upload once for all (optimization)
  const mimeType = mime.lookup(logoPath) || 'application/octet-stream'
  setHeader(event, 'Content-Type', mimeType)

  const stats = fs.statSync(logoPath)

  stats.mtime.setMilliseconds(0)
  if (!handleCacheHeaders(event, { modifiedTime: stats.mtime, maxAge: 1000 })) {
    sendStream(event, fs.createReadStream(logoPath))
  }
})
