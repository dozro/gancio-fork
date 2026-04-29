import { defineEventHandler } from 'h3'
import { requireAdminSession } from '~~/server/lib/session'
import { pluginController, publicSettings } from '~~/server/services'

export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  // return plugins and inner settings
  return pluginController.plugins.map(({ manifest }) => {
    if (publicSettings['plugin_' + manifest.name]) {
      return { ...manifest, settingsValue: publicSettings['plugin_' + manifest.name] }
    }
    return manifest
  })
})
