import { defineEventHandler, readBody } from 'h3'

import { Announcement } from '~~/server/services'
export default defineEventHandler(async (evt) => {
  const body = await readBody(evt)
  return Announcement.create(body)
})
