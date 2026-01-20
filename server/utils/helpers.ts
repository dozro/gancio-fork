import type { H3Event } from 'h3'
import mime from 'mime-types'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'

/**
 * Serves a static file
 * Sets appropriate Content-Type and cache headers based on the file.
 * Streams the file content to the client.
 *
 * @param event - The H3Event representing the incoming request.
 * @param path - The file system path to the file to be served.
 */
export async function serveFile (event: H3Event, path: string) {
  const s = await stat(path).then(s => s.isFile() ? s : null).catch(() => null)
  if (!s) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const mimeType = mime.lookup(path) || 'application/octet-stream'
  setHeader(event, 'Content-Type', mimeType)

  s.mtime.setMilliseconds(0)
  const modifiedTime = s.mtime
  const etag = `"${s.size}-${Number(s.mtimeMs).toString(16)}"`
  if (!handleCacheHeaders(event, { modifiedTime, etag }))

    return sendStream(event, createReadStream(path))
}
