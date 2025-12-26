/**
 * FrontEnd helpers utilities
 */
 
 
import type { APUser } from "#build/types/nitro-imports"

export function mediaURL(event: EventAPI, type?: string, format = '.jpg') {
  const settings = useState<Settings>('settings')
  const mediaPath = type === 'download' ? '/download/' : '/media/'
  if (event.media && event.media.length) {
    if (type === 'alt') {
      return event?.media?.[0]?.name
    } else {
      return settings?.value?.baseurl + mediaPath + (type === 'thumb' ? 'thumb/' : '') + event?.media?.[0]?.url?.replace(/.jpg$/, format)
    }
  } else if (type !== 'alt') {
    return settings?.value?.baseurl + mediaPath + (type === 'thumb' ? 'thumb/' : '') + 'logo.svg'
  }
  return ''
}


export function manageSetting<K extends keyof Settings>(key: K, setCb?: Function) {
  const settings = useState<Settings>('settings')
  return computed<Settings[K]>({
    get: () => settings.value[key],
    set: (value) => {
      $fetch('/api/settings', { method: 'PUT', body: { key, value } })
      if (typeof setCb === 'function') { setCb(value) }
      settings.value[key] = value
    }
  })
}


/**
 * This is a generic formatter to use especially in templates
 */
export const format = {
  /** Actor formatter, used in Admin > Collections > Filter > Instance autocomplete */
  actor (actor: APUser, context='label') {
    const settings = useState<Settings>('settings')
    if (context === 'title') {
      if (actor?.ap_id) {
        return actor?.object?.name
      } else {
        return 'Local Instance'
      }
    } else if (context === 'label' || context === 'filter') {
      if (actor?.ap_id) {
        return `@${actor?.object?.preferredUsername ?? actor?.name}@${actor?.instanceDomain ?? actor?.domain}`
      } else {
        return `@${settings.value?.instance_name}@${settings.value?.hostname}`
      }
    } else if (context === 'icon') {
      if (actor?.ap_id) {
        return actor?.object?.icon?.url ?? `${actor?.instanceDomain ?? actor?.domain ?? ''  }/favicon.ico`
      } else {
        return settings.value.baseurl + '/logo.png'
      }
    }
  }
}
