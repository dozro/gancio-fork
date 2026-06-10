import { defineEventHandler, getRouterParam } from 'h3'
import { isRole } from '~~/server/lib/auth'
import { Page } from '~~/server/services'
export default defineEventHandler(async (event) => {
  const page = getRouterParam(event, 'page')
  if (await isRole(event, 'admin')) {
    return Page.findOne({ where: { slug: page } })
  }
  return Page.findOne({ where: { slug: page, visible: true } })
})
