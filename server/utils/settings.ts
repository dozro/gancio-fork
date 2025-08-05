import { z } from 'zod'
import { updateActor } from '../federation/helpers'

export type Settings = {
  title: string,
  description: string,
  /** The path to the logo image for the instance */
  logo?: string,
  baseurl: string,
  hostname: string,
  instance_timezone: string,
  instance_locale: string,
  instance_name: string,
  allow_registration: boolean,
  allow_anon_event: boolean,
  allow_multidate_event: boolean,
  allow_recurrent_event: boolean,
  allow_event_without_end_time: boolean,
  allow_online_event: boolean,
  show_download_media: boolean,
  enable_moderation: boolean,
  enable_report: boolean,
  recurrent_event_visible: boolean,
  allow_geolocation: boolean,
  geocoding_provider_type: string
  geocoding_provider: string
  geocoding_countrycodes: Array<string>,
  tilelayer_provider: string
  tilelayer_provider_attribution: string,
  enable_federation: boolean,
  federated_events_in_home: boolean,
  enable_resources: boolean,
  hide_boosts: boolean,
  'theme.is_dark': boolean,
  dark_colors: object //{ primary: '#FF6E40', error: '#FF5252', info: '#2196F3', success: '#4CAF50', warning: '#FB8C00' },
  light_colors: object // { primary: '#FF4500', error: '#FF5252', info: '#2196F3', success: '#4CAF50', warning: '#FB8C00' },
  hide_thumbs: boolean,
  hide_calendar: boolean,
  footerLinks: Array<object> 
  plugins: Array<object>,
  admin_email: string
  smtp: object,
  collection_in_home?: number,
  calendar_first_day_of_week?: number,
  default_fedi_hashtags: Array<string>,
  custom_js: string,
  custom_css: string
}

export type SecretSettings = {
  privateKey?: string,
}

// export type KeyValueType =
// | { [key: string]: string | boolean | object | null | number | undefined }

export const settingSchema = z.object({
  key: z.string(),
  is_secret: z.boolean().default(false),
  value: z.union([z.string(), z.boolean()])
})

const config = (await import('../config')).default // useRuntimeConfig()
export type SettingType = z.infer<typeof settingSchema>

export const publicSettings:Settings = {
  title: config?.title || 'Gancio',
  description: config?.description || 'A shared agenda for local communities',
  baseurl: config.baseurl || '',
  hostname: config.hostname,
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
  default_fedi_hashtags: [],
  custom_js: '',
  custom_css: '',
}

export const secretSettings:Record<keyof SecretSettings, any> = {
  privateKey: null
}

export function getSetting (key: keyof Settings) {
    return publicSettings[key]
}
export async function getSettings () {
  return Setting.findAll({ raw: true })
}

export function setSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
  is_secret: boolean = false
): Promise<[entity: Setting, created: boolean | null]> {
  const log = useLogger('settings')
  log.info(`SET '${key}' -> '${value}'`)
  if (is_secret) {
    secretSettings[key] = value
  } else {
    if (key === 'description') {
      updateActor()
    }
    publicSettings[key] = value
  }
  return Setting.upsert({ key, value, is_secret })
}

export async function loadSettings () {
  const settings = await Setting.findAll()
  for (const setting of settings) {
    if (setting.is_secret) {
      secretSettings[setting.key] = setting.value
    } else {
      publicSettings[setting.key] = setting.value
    }
  }
}
