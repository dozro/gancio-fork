import { defineEventHandler, getRouterParam, setHeader, sendRedirect, sendStream, createError } from 'h3'
import { basename } from 'path'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { get as getConfig } from '../../services/config'
import { safeResolvePath } from '~~/server/helpers'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  const config = getConfig()

  let filePath: string
  try {
    filePath = safeResolvePath(config.upload_path, path || '')
  } catch {
    throw createError({ status: 404, message: 'Not found, but nice try ' })
  }

  const s = await stat(filePath).then(s => s.isFile() ? s : null).catch(() => null)
  if (!s) {
    return sendRedirect(event, '/fallbackimage.png', 302)
  }

  const stream = createReadStream(filePath)

  // Set headers for download
  setHeader(event, 'Content-Type', 'application/octet-stream')
  setHeader(event, 'Content-Disposition', `attachment; filename="${basename(filePath).replace(/[^\w.-]/g, '_')}"`)

  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'Content-Length', s.size)

  return sendStream(event, stream)
})
