import { defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '~~/server/lib/auth'
import { Page } from '~~/server/services'

export default defineEventHandler(async (evt) => {
  await requireAdmin(evt)
  const body = await readBody(evt)
  return Page.create(body)
})