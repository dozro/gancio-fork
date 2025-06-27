// import { connect } from '~/server/utils/sequelize'

import pluginController from "../utils/plugins"

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
    // usePluginController()._load()
    // pluginController._load()
    

  } catch (e) {
    log.error(`Error connecting to database`)
    log.error(e)
    process.exit(1)
  }
})
