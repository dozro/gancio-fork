import { defineEventHandler, getRouterParam, setHeader, sendRedirect, sendStream, createError } from 'h3'
import { join } from 'path'
import { createReadStream, existsSync, statSync } from 'fs'
import { get as getConfig } from '../../config'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  const config = getConfig()
  const filePath = join(config.upload_path, path || '')

  if (!existsSync(filePath)) {
    return sendRedirect(event, '/fallbackimage.png', 302)
  }

  const stat = statSync(filePath)
  const stream = createReadStream(filePath)


  // Set headers for download
  setHeader(event, 'Content-Type', 'application/octet-stream')
  setHeader(event, 'Content-Disposition', `attachment; filename="${path}"`)

  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'Content-Length', stat.size.toString())

  return sendStream(event, stream)
})
