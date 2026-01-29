import { type Settings, publicSettings, publicSettingsLastModified } from '~~/server/services'

export default defineEventHandler(async (evt) => {
  const allowed_settings: Array<keyof Settings> = ['title', 'description', 'logo', 'baseurl', 'instance_name', 'hostname', 'about',
    'allow_registration', 'allow_anon_event', 'allow_multidate_event', 'allow_recurrent_event', 'allow_event_without_end_time',
    'allow_online_event', 'show_download_media', 'enable_moderation', 'enable_report', 'enable_federation',
    'enable_resources', 'recurrent_event_visible', 'hide_calendar', 'allow_geolocation', 'hide_thumbs', 'hide_boosts']

  const key = getRouterParam(evt, 'key')
  if (key && typeof publicSettings[key] != 'undefined' && allowed_settings.includes(key)) {
    if (!handleCacheHeaders(evt, { modifiedTime: publicSettingsLastModified[key] })) {
      return publicSettings[key]
    }
  } else {
    throw createError({ statusCode: 404, statusMessage: 'Cannot access this setting' })
  }
})