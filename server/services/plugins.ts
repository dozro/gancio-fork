import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import { get as getConfig } from '../services/config'
import * as db from './db'
import { useLogger } from '../lib/logger'
import { type H3Event, createError, getRouterParam } from 'h3'
import { publicSettings, setSetting } from './settings'
import { parseIcsData } from './icsparser'
import { type TaskManager, useTaskManager } from './taskManager'
import type { EventAPI } from '~~/shared/types/generic'
import type { PluginSettings, Settings } from '~~/shared/types/settings'
import { findOrCreateTags } from './tags'
import emitter from '../lib/emitter'

const log = useLogger('plugins')

export type GancioPluginManifest = {
  /** name of plugin, this is a key and must be unique */
  name: string
  author?: string
  version?: string
  url?: string
  /** a small plugin description, support html */
  description?: string
  settings?: {
    [key: string]: {
      type?: 'NUMBER' | 'TEXT' | 'CHECK' | 'LIST'
      items?: string[] // for type LIST, the possible values
      description?: string
      required?: boolean
      hint?: string
      default?: string | number | boolean
    }
  }
}

type LogType = 'silent' | 'fatal' | 'error' | 'warn' | 'log' | 'info' | 'success' | 'fail' | 'ready' | 'start' | 'box' | 'debug' | 'trace' | 'verbose'
interface LogFn {
  (message: unknown, ...args: unknown[]): void
}

export interface GancioContext {
  log: Record<LogType, LogFn>
  db: typeof db
  publicSettings: Settings
  services: {
    parseIcsData: typeof parseIcsData
    TaskManager: TaskManager
    findOrCreateTags: typeof findOrCreateTags
  }
}

export type GancioPlugin = {
  settings?: PluginSettings
  manifest: GancioPluginManifest
  load: (settings?: unknown) => Promise<void> | void
  unload?: () => Promise<void> | void
  onTest?: (settings: PluginSettings) => Promise<void> | void
  routeAPI?: (event: H3Event) => unknown

  onCLI?: (args: string[]) => Promise<void> | void
  onEventCreate?: (event: EventAPI) => Promise<void> | void
  onEventDelete?: (event: EventAPI) => Promise<void> | void
  onEventUpdate?: (event: EventAPI) => Promise<void> | void
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, any> // allow plugins to have custom properties/methods

const pluginController = {
  plugins: [] as GancioPlugin[],

  async togglePlugin(name: string) {
    const plugin = pluginController.getPlugin(name)
    if (!plugin) throw createError({ statusCode: 404, message: 'Plugin not found' })

    const settingKey = `plugin_${name}`
    const pluginSettings = publicSettings[settingKey] as PluginSettings
    log.info(`Settings for plugin ${plugin.manifest.name}:`, pluginSettings)

    if (!pluginSettings?.enable) {
      log.info(`Loading plugin ${plugin.manifest.name}`)
      await plugin.load()
    } else {
      await plugin.unload?.()
    }

    await setSetting(settingKey, {
      ...pluginSettings,
      enable: !pluginSettings?.enable
    })
  },

  async runCLI(name: string, args: string[]) {
    const plugin = pluginController.getPlugin(name)
    if (!plugin || typeof plugin.onCLI !== 'function') {
      log.warn(`Plugin ${name} not found or onCLI not found`)
      return
    }

    return plugin.onCLI(args)
  },

  async routeAPI(evt: H3Event) {
    const pluginName = getRouterParam(evt, 'name')

    if (!pluginName) {
      throw createError({ statusCode: 400, statusMessage: 'Plugin name is required' })
    }

    const plugin = pluginController.getPlugin(pluginName)
    if (!plugin || typeof plugin.routeAPI !== 'function') {
      log.warn(`Plugin ${pluginName} not found or routeAPI not found`)
      throw createError({ statusCode: 404, message: 'Plugin or routeAPI method not found' })
    }

    // is plugin enabled?
    if (!plugin.settings?.enable) {
      log.warn(`Plugin ${pluginName} is not enabled`)
      throw createError({ statusCode: 403, message: 'Plugin is not enabled' })
    }

    return plugin.routeAPI(evt)
  },

  async testPlugin(name: string, settings = publicSettings?.[`plugin_${name}`] as PluginSettings) {
    const plugin = pluginController.getPlugin(name)

    if (!plugin || typeof plugin.onTest !== 'function') {
      throw createError({ statusCode: 404, message: 'Plugin or test method not found' })
    }

    return plugin.onTest(settings)
  },

  async unloadPlugin(name: string) {
    const plugin = pluginController.getPlugin(name)
    if (!plugin) return

    log.info(`Unloading plugin ${name}`)

    emitter.off('event:Create', plugin.onEventCreate)
    emitter.off('event:Delete', plugin.onEventDelete)
    emitter.off('event:Update', plugin.onEventUpdate)

    try {
      plugin?.unload?.()
    } catch (err) {
      log.error(`Error during unload of ${name}:`, err)
    }
  },

  /**
   * import specified plugin, get its manifest and load it if enabled
   */
  async initPlugin(pluginPath: string, loadIfEnabled = true) {
    try {
      log.debug(`Initializing plugin in ${pluginPath}`)

      // import module
      const rawPlugin = await import(pluginPath)
      if (!rawPlugin?.default || typeof rawPlugin.default !== 'function') {
        log.warn(`Plugin at ${pluginPath} does not export a default function`)
        throw new Error(`Plugin at ${pluginPath} does not export a default function`)
      }
      const plugin: GancioPlugin = rawPlugin.default({
        log,
        publicSettings,
        db,
        services: {
          parseIcsData,
          TaskManager: useTaskManager(),
          findOrCreateTags
        }
      })
      log.debug(`Imported plugin ${pluginPath}`)
      const pluginName = plugin?.manifest?.name
      if (!pluginName) {
        log.warn(`Plugin at ${pluginPath} has no name; skipping load`)
        throw new Error(`Plugin at ${pluginPath} has no name`)
      }

      // is this plugin already loaded?
      if (pluginController.getPlugin(pluginName)) {
        log.warn(`Plugin ${pluginName} already loaded`)
        throw new Error(`Plugin ${pluginName} already loaded`)
      }

      const pluginSettings = publicSettings?.[`plugin_${pluginName}`] as PluginSettings
      if (loadIfEnabled && pluginSettings?.enable && typeof plugin.load === 'function') {
        plugin.settings = pluginSettings // make settings available to plugin instance
        if (plugin.onEventCreate) emitter.on('event:Create', plugin.onEventCreate)
        if (plugin.onEventDelete) emitter.on('event:Delete', plugin.onEventDelete)
        if (plugin.onEventUpdate) emitter.on('event:Update', plugin.onEventUpdate)

        await plugin.load(pluginSettings)
      } else {
        setSetting(`plugin_${pluginName}`, {
          ...pluginSettings,
          enable: false
        })
        plugin.settings = { ...pluginSettings, enable: false }
      }

      pluginController.plugins.push(plugin)

      return plugin
    } catch (err) {
      log.warn(`Failed to load plugin at ${pluginPath}: ${String(err)}`)
      throw err
    }
  },

  getPlugin(name: string): GancioPlugin | undefined {
    return pluginController.plugins.find(p => p.manifest.name === name)
  },

  /**
  * search for all installed plugins, load enabled ones
  */
  async initialize(loadIfEnabled = true) {
    const config = getConfig()
    const pluginsPath = path.resolve(config.plugins_path) || path.resolve(process.cwd(), 'plugins')

    log.debug(`Initializing plugins from: ${pluginsPath}`)

    const dirs = await fs.readdir(pluginsPath).catch(() => {
      log.warn(`Plugins path does not exist: ${pluginsPath}`)
      return []
    })

    return Promise.allSettled(dirs.map(async (d) => {
      const pluginPath = path.join(pluginsPath, d)

      // search for index.ts or index.js first to allow both file-based and folder-based plugins
      const indexTsPath = path.join(pluginPath, 'index.ts')
      const indexJsPath = path.join(pluginPath, 'index.js')
      if (existsSync(indexTsPath)) {
        return pluginController.initPlugin(indexTsPath, loadIfEnabled)
      } else if (existsSync(indexJsPath)) {
        return pluginController.initPlugin(indexJsPath, loadIfEnabled)
      } else if (existsSync(pluginPath) && (pluginPath.endsWith('.js') || pluginPath.endsWith('.ts'))) {
        return pluginController.initPlugin(pluginPath, loadIfEnabled)
      } else {
        log.warn(`No valid entry point found for plugin in ${pluginPath}, skipping`)
        return Promise.reject(new Error(`No valid entry point found for plugin in ${pluginPath}`))
      }
    }))
  }
}

export default pluginController
