import type { Event } from "#build/types/nitro-imports"

export function mediaURL (event: Event, type?: string, format = '.jpg') {
  const settings = useState<Settings>('settings')
  const mediaPath = type === 'download' ? '/download/' : '/media/'
  if (event.media && event.media.length) {
    if (type === 'alt') {
      return event?.media?.[0]?.name
    } else {
      return settings?.value?.baseurl + mediaPath + (type === 'thumb' ? 'thumb/' : '') + event?.media?.[0]?.url.replace(/.jpg$/, format)
    }
  } else if (type !== 'alt') {
    return settings?.value?.baseurl + mediaPath + (type === 'thumb' ? 'thumb/' : '') + 'logo.svg'
  }
  return ''
}
