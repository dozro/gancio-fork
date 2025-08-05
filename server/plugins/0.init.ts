import pluginController from "../utils/plugins"

// @tofix
// this is stupid but it did not found another way to embed deps inside nuxt build (vite external ssr?)
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import dotenv from 'dotenv'
hideBin(process.argv)
yargs.toString()
dotenv.config()


export default defineNitroPlugin(async () => {
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
    log.error(`Error connecting to database`)
    log.error(e)
    process.exit(1)
  }
})
