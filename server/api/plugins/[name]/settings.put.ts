import { createError, getRouterParam, readBody, defineEventHandler } from 'h3'
import { requireAdminSession } from '~~/server/lib/session'
import { pluginController, setSetting } from '~~/server/services'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const pluginName = getRouterParam(event, 'name')
  if (!pluginName) {
    throw createError({ statusCode: 400, message: 'Plugin name is required' })
  }

  const plugin = pluginController.getPlugin(pluginName)
  if (!plugin) {
    throw createError({ statusCode: 404, message: 'Plugin not found' })
  }

  const body = await readBody(event)
  const settingKey = `plugin_${pluginName}`

  // update settings
  await setSetting(settingKey, body)
  plugin.settings = body

  // reload plugin with new settings
  await plugin.unload?.()
  if (plugin.settings.enable) {
    await plugin.load()
  }

  return { success: true }
})