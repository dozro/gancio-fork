/**
** This is the first and only server plugin and this is where everything start
*/
import type { NitroApp } from 'nitropack'
import pluginController from '../services/plugins'
import fsDriver from 'unstorage/drivers/fs'
import { get as getConfig } from '../services/config'
import { useLogger } from '../lib/logger'
import { parseCLI } from '../cli'
import { loadSettings, publicSettings, status } from '../services/settings'
import { useTaskManager } from '../services/taskManager'
import { connect, runMigrations } from '../services/db'
import { useCreateDirectoryStructure } from '../services/directories'

export default defineNitroPlugin(async (_nitroApp: NitroApp) => {
  const isTest = process.env.VITEST === 'true'

  const log = useLogger('init')
  try {
    const config = getConfig()
    async function startGancio() {
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
    }

    // this is an hack to simulate process.argv while developing
    const isBuild = process.env.NODE_ENV === 'production'
    if (!isBuild && process.env.ARGV) {
      process.argv = process.env.ARGV.split(' ')
      log.warn('Using ARGV to test process.argv in dev mode', process.argv, process.argv0)
    }

    if (!isBuild && !process.env.ARGV) {
      log.info('Dev startup')
      await startGancio()
    } else {
      const ret = parseCLI(startGancio)
      if (!ret) {
        process.exit(1)
      }
    }
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})
