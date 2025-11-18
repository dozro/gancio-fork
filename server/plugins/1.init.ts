/**
** This is the first and only server plugin and this is where everything start
*/
import type { NitroApp } from "nitropack"
import pluginController from "../utils/plugins"
import fsDriver from 'unstorage/drivers/fs'
import { get as getConfig } from '../config'

export default defineNitroPlugin(async (nitroApp: NitroApp) => {

  const log = useLogger('init')
  try {
    const config = getConfig()
    async function start() {
      try {
        log.info('Connecting to database')
        await connect()
        await runMigrations()
        log.info('Loading settings')
        await loadSettings()

        log.info('Loading task manager')
        useTaskManager().start()

        log.info('Loading plugins')
        pluginController._load()

        const storage = useStorage()
        const driver = fsDriver({ base: config.user_locale })
        storage.mount('custom_user_locale', driver)

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
      await start()
    } else {
      const ret = main(start)
      if (!ret) {
        process.exit(1)
      }
    }
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

})
