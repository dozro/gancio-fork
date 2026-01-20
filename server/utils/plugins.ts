/**
* TODO:
*/

/* eslint-disable */

import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { get as getConfig } from '../config'
import { sequelize } from './sequelize'

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// import settingsController from './settingsController'
// import notifier from '../notifier'
// import { logger } from '../log'
// import db from '../models'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const log = useLogger('plugins')

interface Plugin {
  configuration: {
    name: string
    [key: string]: unknown
  }
  load?: (ctx: any, settings: any) => void
  unload?: () => void
  routeAPI?: (req: any, res: any, next?: any) => void
  onTest?: () => Promise<void>
  onEventCreate?: (...args: any[]) => void
  onEventDelete?: (...args: any[]) => void
  onEventUpdate?: (...args: any[]) => void
}

const pluginController = {
  plugins: [] as Plugin[],

  getAll() {
    return pluginController.plugins.map(({ configuration }) => {
      const settingKey = `plugin_${configuration.name}`
      const pluginSetting = publicSettings[settingKey]
      if (pluginSetting) {
        configuration.settingsValue = pluginSetting
      }
      return configuration
    })
  },

  async togglePlugin(name: string) {
    const settingKey = `plugin_${name}`
    const pluginSettings = publicSettings[settingKey]
    if (!pluginSettings) throw createError({ statusCode: 404, message: 'Plugin not found' })

    if (!pluginSettings.enable) {
      await pluginController.loadPlugin(name)
    } else {
      await pluginController.unloadPlugin(name)
    }

    await setSetting(settingKey, {
      ...pluginSettings,
      enable: !pluginSettings.enable
    })
  },

  async routeAPI(req: any, res: any, next?: any) {
    const pluginName = req.params.plugin
    const plugin = pluginController.plugins.find(p => p.configuration.name === pluginName)

    if (!plugin || typeof plugin.routeAPI !== 'function') {
      log.warn(`Plugin ${pluginName} routeAPI not found`)
      res.statusCode = 404
      return res.end()
    }

    return plugin.routeAPI(req, res, next)
  },

  async testPlugin(name: string) {
    const plugin = pluginController.plugins.find(p => p.configuration.name === name)

    if (!plugin || typeof plugin.onTest !== 'function') {
      throw createError({ statusCode: 404, message: 'Plugin or test method not found' })
    }

    if (plugin.unload) {
      plugin.unload()
    }

    if (plugin.load) {
      const settings = publicSettings[`plugin_${name}`]
      await plugin.load({
        // helpers: await import('../helpers'),
        log,
        settings: publicSettings,
        db: sequelize
      }, settings)
    }
    await plugin.onTest()
    if (plugin.unload) {
      plugin.unload()
    }
  },

  async unloadPlugin(name: string) {
    const plugin = pluginController.plugins.find(p => p.configuration.name === name)
    if (!plugin) return

    log.info(`Unloading plugin ${name}`)

    // notifier.emitter.off('Create', plugin.onEventCreate)
    // notifier.emitter.off('Delete', plugin.onEventDelete)
    // notifier.emitter.off('Update', plugin.onEventUpdate)

    try {
      plugin.unload?.()
    } catch (err) {
      log.error(`Error during unload of ${name}:`, err)
    }
  },

  async loadPlugin(name: string) {
    const plugin = pluginController.plugins.find(p => p.configuration.name === name)
    const settings = publicSettings[`plugin_${name}`]
    if (!plugin || !plugin.load) return

    log.info(`Loading plugin ${name}`)

    // notifier.emitter.on('Create', plugin.onEventCreate)
    // notifier.emitter.on('Delete', plugin.onEventDelete)
    // notifier.emitter.on('Update', plugin.onEventUpdate)

    plugin.load({
      // helpers: await import('../helpers'),
      log,
      settings: publicSettings,
      db: sequelize
    }, settings)
  },

  async _loadPlugin(filePath: string) {
    try {
      log.info(`Loading plugin ${filePath}`)

      // const plugin: Plugin = await import(filePath)
      const plugin: Plugin = require(filePath)
      const { name } = plugin.configuration

      log.info(`Discovered plugin '${name}' at ${filePath}`)

      if (pluginController.plugins.some(p => p.configuration.name === name)) {
        log.warn(`Plugin ${name} already loaded`)
        return
      }

      pluginController.plugins.push(plugin)

      const settingKey = `plugin_${name}`
      const pluginSettings = publicSettings[settingKey]

      if (pluginSettings?.enable) {
        await pluginController.loadPlugin(name)
      } else {
        log.info(`Plugin ${name} not enabled; skipping load`)
        await setSetting(settingKey, { enable: false })
      }
    } catch (err) {
      log.warn(`Failed to load plugin at ${filePath}: ${String(err)}`)
    }
  },

  async _load() {
    const config = getConfig()
    const defaultPath = path.resolve(__dirname, '../../gancio_plugins')
    const customPath = path.resolve(config.plugins_path) || path.resolve(process.cwd(), 'plugins')
    const paths = customPath === defaultPath ? [customPath] : [customPath, defaultPath]

    log.info(`Loading plugins from: ${paths.join(', ')}`)

    for (const dir of paths) {
      if (!existsSync(dir)) continue
      const dirs = await fs.readdir(dir)

      for (const d of dirs) {
        const pluginEntry = path.join(dir, d, 'index.js')
        if (existsSync(pluginEntry)) {
          await pluginController._loadPlugin(pluginEntry)
        }
      }
    }
  }
}

export default pluginController
