import { z } from 'zod'
import { updateActor } from '../federation/helpers'
import { promisify } from 'util'
import crypto from 'crypto'
const generateKeyPair = promisify(crypto.generateKeyPair)


export type Settings = {
  title: string,
  description: string,
  /** the path to the logo image for the instance */
  logo?: string,
  header_image?: string,
  fallback_image?: string,
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
  footerLinks: Array<FooterLink>
  plugins: Array<object>,
  admin_email: string,
  smtp: { port?: number, host?: string, secure?: boolean, requireTLS?: boolean, auth?: { user: string, pass: string }, from?: string },
  collection_in_home?: string,
  calendar_first_day_of_week?: number,
  default_fedi_hashtags: Array<string>,
  custom_js: string,
  custom_css: string,
  publicKey?: string
}

export type SecretSettings = {
  privateKey?: string,
}

export const settingSchema = z.object({
  key: z.string(),
  is_secret: z.boolean().default(false),
  value: z.union([z.string(), z.boolean()])
})
import { get as getConfig } from '../config'
const config = getConfig()
export type SettingType = z.infer<typeof settingSchema>

export let publicSettingsLastModified: Partial<Record<keyof Settings, Date>> = {}

export const publicSettings: Settings = {
  title: config?.title || 'Gancio',
  description: config?.description || 'A shared agenda for local communities',
  baseurl: config.baseurl || '',
  hostname: new URL(config.baseurl).hostname,
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
  default_fedi_hashtags: [],
  custom_js: '',
  custom_css: '',
  admin_email: '',
  smtp: {}
}

export const secretSettings: Record<keyof SecretSettings, any> = {
  privateKey: null
}

export function getSetting(key: keyof Settings) {
  return publicSettings[key]
}
export async function getSettings() {
  return Setting.findAll({ raw: true })
}

type AllSettings = Settings & SecretSettings

export async function setSetting<K extends keyof AllSettings>(
  key: K,
  value: AllSettings[K],
  is_secret: boolean = false
): Promise<[entity: Setting, created: boolean | null]> {
  const log = useLogger('settings')
  log.info(`SET '${key}' -> '${value}'`)
  if (is_secret) {
    secretSettings[key] = value
  } else {
    // when changing this we have to update the actor
    if (['description', 'logo'].includes(key)) {
      updateActor()
    }
    publicSettings[key] = value
  }
  const setting = await Setting.upsert({ key, value, is_secret })
  if (!is_secret) {
    publicSettingsLastModified[key] = setting[0].updatedAt
  }
  return setting
}

export async function loadSettings() {
  const settings = await Setting.findAll()
  for (const setting of settings) {
    if (setting.is_secret) {
      secretSettings[setting.key] = setting.value
    } else {
      publicSettings[setting.key] = setting.value
      publicSettingsLastModified[setting.key] = setting.updatedAt
    }
  }

  // add pub/priv instance key if needed
  if (!publicSettings.publicKey) {
    // log.info('Instance priv/pub key not found, generating....')
    const { publicKey, privateKey } = await generateKeyPair('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })
    setSetting('publicKey', publicKey)
    setSetting('privateKey', privateKey, true)
  }
}
