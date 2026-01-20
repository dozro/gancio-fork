import path from 'path'
import { get as getConfig } from '../config'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const logoPath = path.resolve(config.upload_path, publicSettings.header_image || './logo.png')
  return serveFile(event, logoPath)
})
