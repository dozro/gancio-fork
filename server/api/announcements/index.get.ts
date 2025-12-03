/**
 * return visible announcements to show preview in homepage
 * or full announcements for admin panel when `full_attributes` is specified and
 * @param {bool} full_attributes 
 * @cache
 */

import { z } from 'zod'
const querySchema = z.object({
  full_attributes: z.stringbool().default(false).optional()
})

export default defineEventHandler(async evt => {
  const user = await getUser(evt)
  const data = await getValidatedQuery(evt, querySchema.safeParse)
  if (data.error) {
    throw createError({ statusCode: 400, message: data.error.message })
  }
  if (data.data.full_attributes && (user?.is_admin || user?.is_editor)) {
    return Announcement.findAll()
  } else {
    const [data, lastModified] = await Promise.all([
      Announcement.findAll({ where: { visible: true }, attributes: ['title', 'id'], raw: true }),
      await Announcement.max('updatedAt', { where: { visible: true }, raw: true }) as Date
    ])

    return handleHttpCache(evt, { data, lastModified })
  }
})
