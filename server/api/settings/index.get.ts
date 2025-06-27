// import type { KeyValueType } from "~/server/utils/settings"

export default defineCachedEventHandler( async event => {
  const log = useLogger('settings')
  log.info('get settings')
  const { user } = await getUserSession(event)
  if (user?.role === 'admin') {
    return publicSettings
  }
    // const publicSettings = await Setting.findAll({ where: { is_secret: false }})
    // const ret:KeyValueType = {}
    // publicSettings.forEach(setting => {
        // ret[setting.key] = setting.value
    // })
    // return ret
    return publicSettings
}, { maxAge: 5 })