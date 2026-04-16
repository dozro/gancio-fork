import { handleCache } from '~~/server/lib/API'
import { publicSettings, publicSettingsLastModified } from '~~/server/services'
export default defineEventHandler(async (evt) => {
  if (await isSessionRole(evt, 'admin')) {
    return publicSettings
  }

  const homeNeededSettings: Array<keyof Settings> = [
    'title', 'description', 'logo', 'baseurl', 'instance_name', 'hostname', 'footerLinks',
    'allow_registration', 'allow_anon_event', 'allow_multidate_event', 'allow_recurrent_event', 'allow_event_without_end_time',
    'allow_online_event', 'show_download_media', 'enable_moderation', 'enable_report', 'enable_federation',
    'enable_resources', 'recurrent_event_visible', 'hide_calendar', 'allow_geolocation', 'hide_thumbs', 'hide_boosts',
    'dark_colors',
    'light_colors',
    'theme.is_dark'
  ]
  const data: Partial<Record<keyof Settings, unknown>> = {}
  let lastModified = new Date(0)

  for (const key of homeNeededSettings) {
    data[key] = publicSettings[key]
    if (publicSettingsLastModified[key] && lastModified < publicSettingsLastModified?.[key]) {
      lastModified = publicSettingsLastModified[key]
    }
  }

  if (await handleCache(evt, lastModified)) return

  return data
})
