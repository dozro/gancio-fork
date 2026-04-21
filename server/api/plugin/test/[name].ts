import { defineEventHandler, getRouterParam } from 'h3'
import { pluginController } from '~~/server/services'
import { requireAdminSession } from '~~/server/lib/session'

export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  const name = getRouterParam(evt, 'name')
  return pluginController.testPlugin(name)
})