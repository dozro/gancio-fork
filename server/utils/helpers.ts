import { H3Event } from "h3"
import mime from 'mime-types'
import { createReadStream, statSync } from 'fs'

/**
 * Serves a static file
 * Sets appropriate Content-Type and cache headers based on the file.
 * Streams the file content to the client.
 * 
 * @param event - The H3Event representing the incoming request.
 * @param path - The file system path to the file to be served.
 */
export function serveFile (event: H3Event, path: string) {
  const mimeType = mime.lookup(path) || 'application/octet-stream'
  setHeader(event, 'Content-Type', mimeType)

  const stats = statSync(path)
  
  stats.mtime.setMilliseconds(0)
  const modifiedTime = stats.mtime
  const etag = `"${stats.size}-${Number(stats.mtimeMs).toString(16)}"`
  if (!handleCacheHeaders( event, { modifiedTime, etag }))

  return sendStream(event, createReadStream(path))
}