// import { connect } from '~/server/utils/sequelize'
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
    

  } catch (e) {
    log.error(`Error connecting to database`)
    log.error(e)
    process.exit(1)
  }
})
