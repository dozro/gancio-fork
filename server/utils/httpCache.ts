import { getHeader, setHeader } from 'h3'
import type { H3Event } from 'h3'
import crypto from 'crypto'

export interface CacheValidationOptions {
  data: any,
  lastModified: Date,
  etag?: string | boolean,

  /** default: "public, max-age=1, must-revalidate" */
  cacheControl?: string
}

/**
 * sets Last-Modified headers, check if-modified-since and handles 304 if client cache is fresh.
 */
export function handleHttpCache(event: H3Event, { data, lastModified, etag, cacheControl }: CacheValidationOptions): any {
  // set the last modified header
  setHeader(event, 'Last-Modified', lastModified.toUTCString())
  setHeader(event, 'Cache-Control', cacheControl ?? 'public, max-age=1, must-revalidate')
  // setHeader(event, 'ETag', etag)
  // const etag = data
  // ? generateETag(data)
  // : `"${updatedAt.getTime()}"` // fallback: timestamp as weak etag

  const ifModifiedSince = getHeader(event, 'if-modified-since')
  if (!ifModifiedSince) {
    return data
  }

  const modifiedSinceMatch = ifModifiedSince != lastModified.toUTCString()
  // const etagMatch = ifNoneMatch && ifNoneMatch === etag

  // if client cache is valid, respond with 304
  if (!modifiedSinceMatch) {
    return sendNoContent(event, 304)
  } else {
    return data
  }
}

function generateETag(data: any): string {
  const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')
  return `"${hash}"`
}
