import fs from 'fs'
import path from 'path'
import mime from 'mime-types'
import { get as getConfig } from '../config'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const logoPath = path.resolve(config.upload_path, 'fallbackimage.svg')

  const mimeType = mime.lookup(logoPath) || 'application/octet-stream'
  setHeader(event, 'Content-Type', mimeType)

  const stats = fs.statSync(logoPath)
  const etag = `${stats.size}-${Number(stats.mtimeMs).toString(16)}`

  const data = sendStream(event, fs.createReadStream(logoPath))
  return handleHttpCache(event, { data, etag, lastModified: stats.mtime })

})
