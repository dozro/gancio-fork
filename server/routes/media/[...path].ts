import { defineEventHandler, getRouterParam, setHeader, sendRedirect, sendStream } from 'h3'
import { join } from 'path'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { get as getConfig } from '../../config'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const path = getRouterParam(event, 'path')
  const filePath = join(config.upload_path, path || '')

  const s = await stat(filePath).then(s => s.isFile() ? s : null).catch(() => null)
  if (!s) {
    return sendRedirect(event, '/fallbackimage.png', 302)
  }

  if (!handleCacheHeaders(event, { maxAge: 31536000, cacheControls: ['public', 'immutable'] })) {
    setHeader(event, 'Content-Length', s.size)
    return sendStream(event, createReadStream(filePath))
  }

})