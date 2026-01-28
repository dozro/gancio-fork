import { Collection, getLastModified } from "~~/server/services"

/**
 * Get top collections for home page
 */
export default defineEventHandler(async (event) => {
  const collections = await Collection.findAll({ where: { isTop: true }, raw: true })
  const lastModified = getLastModified(collections)
  if (!handleCacheHeaders(event, { modifiedTime: lastModified, maxAge: 60 })) {
    return collections
  }
})
