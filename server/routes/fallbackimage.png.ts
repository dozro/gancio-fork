
import { createReadStream, existsSync, statSync } from 'fs'
import path from 'path'
import { get as getConfig } from '../config'
import mime from 'mime-types'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const imgPath = path.resolve(config.upload_path, publicSettings.fallback_image || 'fallbackimage.svg')
  return serveFile(event, imgPath)
})
