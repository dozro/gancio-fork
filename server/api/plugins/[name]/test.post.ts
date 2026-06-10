import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { requireAdmin } from '~~/server/lib/auth'
import { pluginController } from '~~/server/services'

export default defineEventHandler(async (evt) => {
  await requireAdmin(evt)
  const name = getRouterParam(evt, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Missing plugin name' })
  }
  const { settings } = await readBody(evt)
  try {
    return await pluginController.testPlugin(name, settings)
  } catch (e) {
    return createError({ statusCode: 400, message: String(e) })
  }
})
