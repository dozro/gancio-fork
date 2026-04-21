import { defineEventHandler } from 'h3'
import { enableCors, handleCache } from '~~/server/lib/API'
import { Announcement } from '~~/server/services'

/**
 * return visible announcements to show preview in homepage
 * @cors
 * @return {Array<{ id: number, title: string }>} announcements
 */
export default defineEventHandler(async (evt) => {
  enableCors(evt)
  if (await handleCache(evt, Announcement)) return
  return Announcement.findAll({ where: { visible: true }, attributes: ['title', 'id'] })
})
