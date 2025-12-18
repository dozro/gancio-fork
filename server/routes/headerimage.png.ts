import path from 'path'
import { get as getConfig } from '../config'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const imgPath = path.resolve(config.upload_path, publicSettings.header_image || 'headerimage.svg')
  return serveFile(event, imgPath)
})
