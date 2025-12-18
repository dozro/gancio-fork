import path from 'path'
import { get as getConfig } from '../config'
import { serveFile } from '../utils/helpers'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const logoPath =  path.resolve(config.upload_path, publicSettings.logo || './logo.png')
  return serveFile(event, logoPath)
})
