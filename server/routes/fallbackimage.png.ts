
import fs from 'fs'
import path from 'path'
import { get as getConfig } from '../config'
import mime from 'mime-types'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const logoPath = path.resolve(config.upload_path, 'fallbackimage.svg')
  const mimeType = mime.lookup(logoPath) || 'application/octet-stream'
  setHeader(event, 'Content-Type', mimeType)

  const stats = fs.statSync(logoPath)

  const data = sendStream(event, fs.createReadStream(logoPath))
  return handleHttpCache(event, { data, lastModified: stats.mtime })
})
