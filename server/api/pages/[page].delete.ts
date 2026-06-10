import { defineEventHandler, createError, getRouterParam } from 'h3'
import { requireAdmin } from '~~/server/lib/auth'

import { Page } from '~~/server/services'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const page_id = Number(getRouterParam(event, 'page'))
  const page = await Page.findByPk(page_id)

  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  return page.destroy()
})
