import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { Page } from '~~/server/services'
import { requireAdminSession } from '~~/server/lib/session'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const page_id = Number(getRouterParam(event, 'page'))
  const body = await readBody(event)
  const page = await Page.findByPk(page_id)

  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  return page.update(body)
})