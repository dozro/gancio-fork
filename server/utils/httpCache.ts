import { getHeader, setHeader, send } from 'h3'
import type { H3Event } from 'h3'
import crypto from 'crypto'

export interface CacheValidationOptions {
  data?: any        // Optional raw data (for ETag hash)
  updatedAt?: Date  // Required for Last-Modified / weak ETag
}

/**
 * Sets Last-Modified and ETag headers, handles 304 if client cache is fresh.
 * @returns true if response is fresh (304 sent), false otherwise
 */
export function handleHttpCache(event: H3Event, { data, updatedAt }: CacheValidationOptions): boolean {
  if (!updatedAt) return false

  const lastModified = updatedAt.toUTCString()
  const etag = data
    ? generateETag(data)
    : `"${updatedAt.getTime()}"` // fallback: timestamp as weak etag

  const ifModifiedSince = getHeader(event, 'if-modified-since')
  const ifNoneMatch = getHeader(event, 'if-none-match')

  const modifiedSinceMatch =
    ifModifiedSince && new Date(ifModifiedSince).getTime() >= updatedAt.getTime()
  const etagMatch = ifNoneMatch && ifNoneMatch === etag

  // If client cache is valid, respond with 304
  if (modifiedSinceMatch || etagMatch) {
    setResponseStatus(event, 304)
    return true
  }

  // Otherwise set headers
  setHeader(event, 'Last-Modified', lastModified)
  setHeader(event, 'ETag', etag)
  return false
}

function generateETag(data: any): string {
  const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')
  return `"${hash}"`
}