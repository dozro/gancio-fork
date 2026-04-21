import { defineEventHandler } from 'h3'
import path from 'path'
import { get as getConfig } from '../services/config'
import { serveFile } from '../helpers'
import { publicSettings } from '../services'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const logoPath = path.resolve(config.upload_path, publicSettings.logo || './logo.png')
  return serveFile(event, logoPath)
})