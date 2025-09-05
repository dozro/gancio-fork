import type { NitroApp } from "nitropack"
import pluginController from "../utils/plugins"

export default defineNitroPlugin(async (nitroApp: NitroApp) => {

  async function start () {
    const log = useLogger('init')
    try {
      log.info('Connecting to database')
      await connect()
      log.info('Loading settings')
      await loadSettings()
    
      log.info('Loading task manager')
      useTaskManager().start()
        
      log.info('Loading plugins')
      pluginController._load()
        
      return true
    } catch (e) {
      log.error(`Error connecting to database?`)
      log.error(e)
      process.exit(1)
    }
  }
  
  nitroApp.hooks.hook('cli:start', start)
  
  await main(nitroApp)
})
