import { defineEventHandler, getRouterParam, setHeader, sendRedirect, sendStream } from 'h3'
import { join } from 'path'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import mime from 'mime-types'
import { get as getConfig } from '../../services/config'
import { handleCache } from '~~/server/lib/API'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const path = getRouterParam(event, 'path')
  const filePath = join(config.upload_path, path || '')

  const s = await stat(filePath).then(s => s.isFile() ? s : null).catch(() => null)
  if (!s) {
    return sendRedirect(event, '/fallbackimage.png', 302)
  }

  setHeader(event, 'Content-Type', mime.lookup(filePath) || 'application/octet-stream')

  if (await handleCache(event, s)) return
  setHeader(event, 'Content-Length', s.size)
  return sendStream(event, createReadStream(filePath))
})
