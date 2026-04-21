import { defineEventHandler, readBody } from 'h3'
import { Page } from '~~/server/services'
import { requireAdminSession } from '~~/server/lib/session'

export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  const body = await readBody(evt)
  return Page.create(body)
})