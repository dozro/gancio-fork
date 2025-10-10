import type { NitroApp } from "nitropack"
import pluginController from "../utils/plugins"
import fsDriver from 'unstorage/drivers/fs'
import config from '../config'

export default defineNitroPlugin(async (nitroApp: NitroApp) => {

  async function start () {
    const log = useLogger('init')
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

  const isBuild = process.env.NODE_ENV === 'production'
  if (!isBuild) {
    await start()
  } else {
    nitroApp.hooks.hook('cli:start', start)
    await main(nitroApp)
  }

})
