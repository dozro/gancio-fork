import path from 'path'
import { get as getConfig } from '../config'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const imgPath = path.resolve(config.upload_path, publicSettings.fallback_image || 'fallbackimage.svg')
  return serveFile(event, imgPath)
})
