import path from 'path'
import { get as getConfig } from '../services/config'
import { publicSettings } from '../services'
import { serveFile } from '../helpers'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const imgPath = path.resolve(config.upload_path, publicSettings.fallback_image || 'fallbackimage.svg')
  return serveFile(event, imgPath)
})