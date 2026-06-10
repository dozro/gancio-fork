import { defineEventHandler } from 'h3'
import { requireAdmin } from '~~/server/lib/auth'
import { Page } from '~~/server/services'

export default defineEventHandler(async (evt) => {
  await requireAdmin(evt)
  return Page.findAll()
})