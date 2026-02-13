import path from 'path'
import fs from 'fs'
import pug from 'pug'
import { publicSettings } from '../services'
import { useLogger } from '../lib/logger'

const log = useLogger('Open Search')

export const openSearchTemplate = loadOpenSearchTemplate()

export default defineEventHandler(async (event) => {
  if (!openSearchTemplate) {
    throw createError({ statusCode: 500 })
  }

  const longName = publicSettings.title.includes('Gancio')
    ? publicSettings.title
    : publicSettings.title + ' - Gancio'

  const response = openSearchTemplate({
    settings: publicSettings,
    longName
  })

  setHeader(event, 'Content-Type', 'text/xml')
  setHeader(event, 'Cache-Control', 'public, max-age=2592000, immutable')
  return response
})

function loadOpenSearchTemplate() {
  const isBuild = process.env.NODE_ENV === 'production'
  const templatePath = isBuild ? './nuxt/server/opensearch.pug' : './server/services/opensearch.pug'
  try {
    const templateStr = fs.readFileSync(path.resolve(templatePath), 'utf-8')
    return pug.compile(templateStr)
  } catch (err) {
    log.error('Unable to load opensearch template.', err)
    return null
  }
}
