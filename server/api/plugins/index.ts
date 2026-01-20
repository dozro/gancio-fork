import pluginController from '~~/server/utils/plugins'

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
