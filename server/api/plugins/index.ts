import { defineEventHandler } from 'h3'
import { requireAdmin } from '~~/server/lib/auth'
import { pluginController, publicSettings } from '~~/server/services'

export default defineEventHandler(async (evt) => {
  await requireAdmin(evt)
  // return plugins and inner settings
  return pluginController.plugins.map(({ manifest }) => {
    if (publicSettings['plugin_' + manifest.name]) {
      return { ...manifest, settingsValue: publicSettings['plugin_' + manifest.name] }
    }
    return manifest
  })
})
