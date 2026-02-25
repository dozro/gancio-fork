import { Announcement } from '~~/server/services'
import { requireSessionRole } from '~~/server/utils/session'

/**
 * return full announcements to show in admin panel
 * @auth
 */
export default defineEventHandler(async (evt) => {
  await requireSessionRole(evt, ['admin', 'editor'])
  return Announcement.findAll()
})
