/**
** This is the first and only server plugin and this is where everything start
*/
import type { NitroApp } from 'nitropack'
import { defineNitroPlugin, useStorage } from 'nitropack/runtime'
import pluginController from '../services/plugins'
import fsDriver from 'unstorage/drivers/fs'
import { get as getConfig } from '../services/config'
import { useLogger } from '../lib/logger'
import { loadSettings, publicSettings } from '../services/settings'
import { useTaskManager } from '../services/taskManager'
import { connect, runMigrations } from '../services/db'
import { useCreateDirectoryStructure } from '../services/directories'

export default defineNitroPlugin(async (_nitroApp: NitroApp) => {
  const isTest = process.env.VITEST === 'true'

  const log = useLogger('init')
  const config = getConfig()
  try {
    log.info('Connecting to database')
    await connect()
    await runMigrations()
    log.info('Loading settings')
    await loadSettings()

    log.info('Checking directory structure')
    useCreateDirectoryStructure()

    if (!isTest) {
      log.info('Loading task manager')
      useTaskManager().start()

      log.info('Loading plugins')
      pluginController._load()
    }

    const storage = useStorage()
    const driver = fsDriver({ base: config.user_locale })
    storage.mount('custom_user_locale', driver)

    publicSettings.status = 'ready'
    return true
  } catch (e) {
    log.error(`Error connecting to database?`)
    log.error(e)
    process.exit(1)
  }
})
