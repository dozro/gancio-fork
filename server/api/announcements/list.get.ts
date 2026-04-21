import { defineEventHandler } from 'h3'
import { Announcement } from '~~/server/services'
import { requireSessionRole } from '~~/server/lib/session'

/**
 * return full announcements to show in admin panel
 * @auth
 */
export default defineEventHandler(async (evt) => {
  await requireSessionRole(evt, ['admin', 'editor'])
  return Announcement.findAll()
})
