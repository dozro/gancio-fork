import { defineEventHandler, setHeader } from 'h3'
import fs from 'fs/promises'
import { publicSettings, publicSettingsLastModified } from '../services/settings'
import { handleCache } from '../lib/API'
import { absolutizePath } from '../services/config'

/**
 * return a custom css
 * this is a merge from custom settings available from admin panel
 * and a local `custom.css` file if present (ref: #610)
 * @cached
 */
export default defineEventHandler(async (event) => {
  // custom css from admin panel settings
  let custom_css = publicSettings.custom_css
  let lastModified = publicSettingsLastModified.custom_css || new Date(0)
  try {
    const filePath = absolutizePath('./custom.css')
    const stat = await fs.stat(filePath)
    custom_css += await fs.readFile(filePath, 'utf8')
    if (stat.mtime > lastModified) {
      lastModified = stat.mtime
    }
  } catch {
    custom_css += '\n/** no custom.css file **/'
  }

  setHeader(event, 'Content-Type', 'text/css')
  if (await handleCache(event, lastModified)) return
  return custom_css
})