import { createError, getRouterParam, getValidatedQuery, defineEventHandler } from 'h3'
import z from 'zod'
import { requireAdmin } from '~~/server/lib/auth'
import { pluginController, setSetting } from '~~/server/services'
import { getSetting } from '~~/server/services/settings'
import type { PluginSettings } from '~~/shared/types/settings'

const querySchema = z.object({
  enable: z.stringbool()
})

/**
 * @openapi
 * /api/plugins/{name}/toggle:
 *   put:
 *     summary: Enable/disable plugin
 *     description: Update plugin enabled status. Admin role is required.
 *     parameters:
 *       - name: name
 *         in: path
 *         required: true
 *         description: Plugin name
 *         example: Example
 *         schema:
 *           type: string
 *       - name: enable
 *         in: query
 *         required: true
 *         description: Set enabled status
 *         example: true
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Plugin settings have been updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   description: Indicates if action has been done.
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Plugin name is required.
 *       404:
 *         description: Plugin not found.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Plugins
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { enable } = await getValidatedQuery(event, querySchema.parse)

  const pluginName = getRouterParam(event, 'name')
  if (!pluginName) {
    throw createError({ statusCode: 400, message: 'Plugin name is required' })
  }

  const plugin = pluginController.getPlugin(pluginName)
  if (!plugin) {
    throw createError({ statusCode: 404, message: 'Plugin not found' })
  }

  const settingKey = `plugin_${pluginName}`

  const oldSettings = ((await getSetting(settingKey)) ?? {}) as PluginSettings
  const newSettings = { ...oldSettings, enable }

  await plugin.unload?.()

  await setSetting(settingKey, newSettings)
  plugin.settings = newSettings

  if (enable) {
    try {
      await plugin.load()
    } catch (error) {
      // Revert enabled flag in settings if something went wrong during load
      await setSetting(settingKey, oldSettings)
      plugin.settings = oldSettings

      plugin.unload?.()

      throw error
    }
  }

  return { success: true }
})
