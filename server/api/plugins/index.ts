import { defineEventHandler } from 'h3'
import { pluginController, publicSettings } from '~~/server/services'

export default defineEventHandler(async () => {
  // return plugins and inner settings
  //
  return pluginController.plugins.map(({ configuration }) => {
    if (publicSettings['plugin_' + configuration.name]) {
      configuration.settingsValue = publicSettings['plugin_' + configuration.name]
    }
    return configuration
  })
  // return res.json(plugins)
})
