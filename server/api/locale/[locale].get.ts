import { defineEventHandler, createError } from 'h3'
import { handleCache } from '~~/server/lib/API'
import { useLogger } from '~~/server/lib/logger'
import { getMaxLastModifieds, publicSettings } from '~~/server/services'
import { runtimeResolve, get as getConfig } from '~~/server/services/config'
import path from 'path'
import { readFile, stat } from 'fs/promises'

const localeStorage = runtimeResolve('../i18n/locales')
const customUserLocaleStorage = getConfig().user_locale

async function statLocale(storage: string, locale: string) {
  return stat(path.resolve(storage, locale + '.json')).catch(() => null)
}

async function getLocale(storage: string, locale: string) {
  const localePath = path.resolve(storage, locale + '.json')
  const localeContent = await readFile(localePath, 'utf-8')
  return JSON.parse(localeContent)
}

export default defineEventHandler(async (event) => {
  const log = useLogger('locale')
  const locale = event.context.params?.locale ?? publicSettings.instance_locale

  // check if this locale exists
  const localeStats = await statLocale(localeStorage, locale)
  if (!localeStats) {
    log.warn(`Requested locale does not exists: ${locale}`)
    throw createError({ status: 404, message: `This locale (${locale}) does not exists!` })
  }

  const customUserLocaleStats = customUserLocaleStorage ? await statLocale(customUserLocaleStorage, locale) : null
  try {
    const fallbackMessages = await getLocale(localeStorage, 'en')
    const fallbackStats = await statLocale(localeStorage, 'en')
    const lastModifieds = [localeStats.mtime, fallbackStats!.mtime]

    let defaultLocaleMessages

    // check if we have a user custom messages
    if (customUserLocaleStats) {
      lastModifieds.push(customUserLocaleStats.mtime)
      defaultLocaleMessages = Object.assign(
        {},
        fallbackMessages,
        await getLocale(localeStorage, locale),
        await getLocale(customUserLocaleStorage, locale)
      )
    } else {
      defaultLocaleMessages = Object.assign(
        {},
        fallbackMessages,
        await getLocale(localeStorage, locale)
      )
    }
    // embedd vuetify locale
    let $vuetify
    const vuetifyLocaleStats = await statLocale(localeStorage + '/vuetify/', locale)
    if (vuetifyLocaleStats) {
      $vuetify = await getLocale(localeStorage + '/vuetify/', locale)
      lastModifieds.push(vuetifyLocaleStats?.mtime)
    } else {
      $vuetify = await getLocale(localeStorage + '/vuetify/', 'en')
      const vuetifyLocaleStats = await statLocale(localeStorage + '/vuetify/', 'en')
      lastModifieds.push(vuetifyLocaleStats!.mtime)
    }

    const maxLastModified = getMaxLastModifieds(lastModifieds)
    if (await handleCache(event, maxLastModified, 60)) return
    return Object.assign(defaultLocaleMessages, { $vuetify })
  } catch (e) {
    throw createError({ status: 400, message: String(e) })
  }
})
