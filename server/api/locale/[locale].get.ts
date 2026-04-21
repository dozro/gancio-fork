import { useStorage } from 'nitropack/runtime'
import { defineEventHandler, createError } from 'h3'
import { handleCache } from '~~/server/lib/API'
import { useLogger } from '~~/server/lib/logger'
import { getMaxLastModifieds } from '~~/server/services'
/**
 */
export default defineEventHandler(async (event) => {
  const log = useLogger('locale')
  const localeStorage = useStorage('locale_storage')
  const customUserLocaleStorage = useStorage('custom_user_locale')
  const locale = event.context.params?.locale

  if (!locale || !await localeStorage.hasItem(locale + '.json')) {
    // check if this locale exists
    log.warn(`Requested locale does not exists: ${locale}`)
    throw createError({ status: 404, message: `This locale (${locale}) does not exists!` })
  }

  try {
    const fallbackMessages = await localeStorage.getItem('en.json')

    const localStorageMeta = await localeStorage.getMeta(locale + '.json')
    const fallbackMessagesMeta = await localeStorage.getMeta('en.json')
    const lastModifieds = [localStorageMeta?.mtime, fallbackMessagesMeta?.mtime]

    let defaultLocaleMessages

    // check if we have a user custom messages
    if (await customUserLocaleStorage.hasItem(locale + '.json')) {
      const customUserLocaleMeta = await customUserLocaleStorage.getMeta(locale + '.json')
      lastModifieds.push(customUserLocaleMeta?.mtime)
      defaultLocaleMessages = Object.assign(
        {},
        fallbackMessages,
        await localeStorage.getItem(locale + '.json'),
        await customUserLocaleStorage.getItem(locale + '.json'))
    } else {
      defaultLocaleMessages = Object.assign(
        {},
        fallbackMessages,
        await localeStorage.getItem(locale + '.json'))
    }
    // embedd vuetify locale
    let $vuetify
    if (await localeStorage.hasItem('vuetify:' + locale + '.json')) {
      $vuetify = await localeStorage.getItem('vuetify:' + locale + '.json')
      const lastModifiedVuetifyMeta = await localeStorage.getMeta('vuetify:' + locale + '.json')
      lastModifieds.push(lastModifiedVuetifyMeta?.mtime)
    } else {
      $vuetify = await localeStorage.getItem('vuetify:en.json')
      const lastModifiedVuetifyMeta = await localeStorage.getMeta('vuetify:' + locale + '.json')
      lastModifieds.push(lastModifiedVuetifyMeta?.mtime)
    }

    const maxLastModified = getMaxLastModifieds(lastModifieds)
    if (await handleCache(event, maxLastModified)) return
    return Object.assign(defaultLocaleMessages, { $vuetify })
  } catch (e) {
    throw createError({ status: 400, message: String(e) })
  }
})
