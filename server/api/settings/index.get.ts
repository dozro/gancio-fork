export default defineEventHandler(async event => {
  const log = useLogger('settings')
  log.info('get settings')
  const { user } = await getUserSession(event)
  if (user?.role === 'admin') {
    return publicSettings
  }

  const homeNeededSettings: Array<keyof Settings> = ['title', 'description', 'logo', 'baseurl',
    'allow_registration', 'allow_anon_event', 'allow_recurrent_event', 'allow_event_without_end_time',
    'allow_online_event', 'show_download_media', 'enable_moderation', 'enable_report', 'enable_federation',
    'enable_resources', 'recurrent_event_visible', 'hide_calendar', 'allow_geolocation', 'hide_thumbs', 'hide_boosts']
  const data: Partial<Record<keyof Settings, any>> = {}
  let lastModified = new Date(0)

  for (const key of homeNeededSettings) {
    data[key] = publicSettings[key]
    if (publicSettingsLastModified[key] && lastModified < publicSettingsLastModified?.[key]) {
      lastModified = publicSettingsLastModified[key]
    }
  }

  return handleHttpCache(event, { data, lastModified })
})
