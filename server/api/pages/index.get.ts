import { defineEventHandler } from 'h3'
import { Page } from '~~/server/services'
import { requireAdminSession } from '~~/server/lib/session'

export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  return Page.findAll()
})