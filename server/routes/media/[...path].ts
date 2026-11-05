import { defineEventHandler, getRouterParam, setHeader, sendRedirect, sendStream, createError } from 'h3'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import mime from 'mime-types'
import { get as getConfig } from '../../services/config'
import { handleCache } from '~~/server/lib/API'
import { safeResolvePath } from '~~/server/helpers'

export default defineEventHandler(async (event) => {
  const config = getConfig()
  const path = getRouterParam(event, 'path')

  let filePath: string
  try {
    filePath = safeResolvePath(config.upload_path, path || '')
  } catch {
    throw createError({ statusCode: 404, message: 'Not found, but nice try ' })
  }

  const s = await stat(filePath).then(s => s.isFile() ? s : null).catch(() => null)
  if (!s) {
    return sendRedirect(event, '/fallbackimage.png', 302)
  }

  setHeader(event, 'Content-Type', mime.lookup(filePath) || 'application/octet-stream')

  if (await handleCache(event, s)) return
  setHeader(event, 'Content-Length', s.size)
  return sendStream(event, createReadStream(filePath))
})
