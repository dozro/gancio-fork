import { getHeader, setHeader } from 'h3'
import type { H3Event } from 'h3'
import crypto from 'crypto'

export interface CacheValidationOptions {
  data: any,
  lastModified: Date,
  etag?: string,

  /** default: "public, max-age=1, must-revalidate" */
  cacheControl?: string
}

/**
 * sets Last-Modified and ETag headers, check if-modified-since and if-none-match and handles 304 if client cache is fresh.
 */
export function handleHttpCache(event: H3Event, { data, etag, lastModified, cacheControl }: CacheValidationOptions): any {

  // set headers (etag could be passed in args or its calculated weak using milliseconds)
  etag = etag ?? lastModified.getTime().toString()
  setHeader(event, 'ETag', etag)
  setHeader(event, 'Last-Modified', lastModified.toUTCString())
  setHeader(event, 'Cache-Control', cacheControl ?? 'public, max-age=1, must-revalidate')

  // check etag match first
  const ifNoneMatch = getHeader(event, 'if-none-match')
  if (ifNoneMatch) {
    if (ifNoneMatch === etag) {
      return sendNoContent(event, 304)
    }
    return data
  }

  // then check if-modified-since
  const ifModifiedSince = getHeader(event, 'if-modified-since')
  if (ifModifiedSince && new Date(ifModifiedSince).getTime() == lastModified.setMilliseconds(0)) {
    return sendNoContent(event, 304)
  }

  return data

}
