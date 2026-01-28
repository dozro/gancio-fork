import { Announcement, getLastModified } from '~~/server/services'
/**
 * return visible announcements to show preview in homepage
 * or full announcements for admin panel when `full_attributes` is specified and the request is coming from 'editor' or 'admin'
 * @param {bool} full_attributes
 * @return {Array<{ id: number, title: string }>} announcements
 */

import { z } from 'zod'
const querySchema = z.object({
  full_attributes: z.stringbool().default(false).optional()
})

export default defineEventHandler(async (evt) => {
  const user = await getUser(evt)
  const { error, data } = await getValidatedQuery(evt, querySchema.safeParse)
  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  if (data.full_attributes && (user?.is_admin || user?.is_editor)) {
    return Announcement.findAll()
  }

  const announcements = await Announcement.findAll({ where: { visible: true }, attributes: ['title', 'id', 'updatedAt'], raw: true })
  const modifiedTime = getLastModified(announcements)
  if (!handleCacheHeaders(evt, { modifiedTime, maxAge: 5, cacheControls: ['must-revalidate', 'stale-while-revalidate=30'] })) {
    return announcements.map(({ updatedAt, ...rest }) => rest)
  }
})
