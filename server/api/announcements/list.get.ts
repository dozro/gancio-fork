import { defineEventHandler } from 'h3'
import { Announcement } from '~~/server/services'
import { requireRole } from '~~/server/lib/auth'

/**
 * return full announcements to show in admin panel
 * @auth
 */
export default defineEventHandler(async (evt) => {
  await requireRole(evt, ['admin', 'editor'])
  return Announcement.findAll()
})
