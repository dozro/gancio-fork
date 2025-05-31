import { z } from 'zod'

export type KeyValueType =
| { [key: string]: string | boolean | object | null }
// import { SettingType } from './sequelize'

export const settingSchema = z.object({
  key: z.string(),
  is_secret: z.boolean().default(false),
  value: z.union([z.string(), z.boolean()])
})

const config = useRuntimeConfig()
export type SettingType = z.infer<typeof settingSchema>

export const publicSettings:KeyValueType = {
  title: config.title || 'Gancio',
  description: config.description || 'A shared agenda for local communities',
  baseurl: config.baseurl || '',
  hostname: '', // new URL(config.baseurl).hostname,
  instance_timezone: 'Europe/Rome',
  instance_locale: 'en',
  instance_name: 'relay',
  allow_registration: true,
  allow_anon_event: true,
  allow_multidate_event: true,
  allow_recurrent_event: false,
  allow_event_without_end_time: true,
  allow_online_event: true,
  show_download_media: true,
  enable_moderation: false,
  enable_report: false,
  recurrent_event_visible: false,
  allow_geolocation: false,
  geocoding_provider_type: 'Nominatim',
  geocoding_provider: 'https://nominatim.openstreetmap.org/search',
  geocoding_countrycodes: [],
  tilelayer_provider: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tilelayer_provider_attribution: "<a target=\"_blank\" href=\"http://osm.org/copyright\">OpenStreetMap</a> contributors",
  enable_federation: true,
  federated_events_in_home: true,
  enable_resources: false,
  hide_boosts: true,
  'theme.is_dark': true,
  dark_colors: { primary: '#FF6E40', error: '#FF5252', info: '#2196F3', success: '#4CAF50', warning: '#FB8C00' },
  light_colors: { primary: '#FF4500', error: '#FF5252', info: '#2196F3', success: '#4CAF50', warning: '#FB8C00' },
  hide_thumbs: false,
  hide_calendar: false,
  footerLinks: [
    { href: '/', label: 'common.home' },
    { href: '/about', label: 'common.about' }
  ],
  plugins: [],
  admin_email: config.admin_email || '',
  smtp: config.smtp || {},
  collection_in_home: null,
  calendar_first_day_of_week: null,
  default_fedi_hashtags: [],
  custom_js: '',
  custom_css: ''
}
export const secretSettings:KeyValueType = {}

export function getSetting (key: string) {
    return publicSettings[key]
}

export async function getSettings () {
  return Setting.findAll({ raw: true })
}

export function setSetting (setting: SettingType) {
  if (setting.is_secret) {
      secretSettings[setting.key] = setting.value
  } else {
      publicSettings[setting.key] = setting.value
  }
  return Setting.upsert(setting)
}

export async function loadSettings () {
  const settings = await Setting.findAll({ raw: true })
  for (const setting of settings) {
    if (setting.is_secret) {
      secretSettings[setting.key] = setting.value
    } else {
      publicSettings[setting.key] = setting.value
    }
  }
}
