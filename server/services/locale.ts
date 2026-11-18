import { createError } from 'h3'
import { getMaxLastModifieds } from '~~/server/helpers'
import { publicSettings } from '~~/server/services/settings'
import { runtimeResolve, get as getConfig } from '~~/server/services/config'
import { defu } from 'defu'
import { createI18n } from 'vue-i18n'
import { safeResolvePath } from '../helpers'
import { readFileSync } from 'fs'
import { stat } from 'fs/promises'
import { useLogger } from '../lib/logger'

export type LocaleMessages = Record<string, unknown>

// get locale raw messages from a locale file
export function getLocale(storage: string, locale: string): LocaleMessages {
  const localePath = safeResolvePath(storage, `${locale}.json`)
  return JSON.parse(readFileSync(localePath, 'utf-8')) as LocaleMessages
}

// stat a locale file to get its last modified date and check if it exists
export async function statLocale(storage: string, locale: string) {
  try {
    return await stat(safeResolvePath(storage, `${locale}.json`))
  } catch {
    return null
  }
}

interface LocaleResult {
  messages: Record<string, unknown>
  maxLastModified?: Date
}

const localeStorage = runtimeResolve('../i18n/locales')
const customUserLocaleStorage = getConfig().user_locale

// cache locale messages
const localeCache = new Map<string, Promise<LocaleResult>>()

// get locale messages for a given locale
export async function getLocaleMessages(locale: string): Promise<LocaleResult> {
  const log = useLogger('locale')

  // check if this locale exists
  const localeStats = await statLocale(localeStorage, locale)
  if (!localeStats) {
    log.warn(`Requested locale does not exists: ${locale}`)
    throw createError({ status: 404, message: `This locale (${locale}) does not exist!` })
  }

  try {
    const fallbackStats = await statLocale(localeStorage, 'en')
    const customStats = customUserLocaleStorage ? await statLocale(customUserLocaleStorage, locale) : null
    const vuetifyStats = await statLocale(`${localeStorage}/vuetify/`, locale)

    const vuetifyFallbackStats = vuetifyStats ? null : await statLocale(`${localeStorage}/vuetify/`, 'en')

    const maxLastModified = getMaxLastModifieds([
      localeStats.mtime,
      fallbackStats?.mtime,
      customStats?.mtime,
      vuetifyStats?.mtime,
      vuetifyFallbackStats?.mtime
    ])

    const cached = localeCache.get(locale)
    if (cached) {
      const result = await cached
      if (result.maxLastModified === maxLastModified) {
        return result
      }

      localeCache.delete(locale)
    }

    const pending = (async (): Promise<LocaleResult> => {
      const fallbackMessages = getLocale(localeStorage, 'en')
      const localeMessages = getLocale(localeStorage, locale)
      const customMessages = customStats ? getLocale(customUserLocaleStorage, locale) : {}

      // merge messages with priority (custom > locale > fallback)
      const messages = defu(customMessages, localeMessages, fallbackMessages)

      const vuetifyMessages = getLocale(`${localeStorage}/vuetify/`, vuetifyStats ? locale : 'en')

      return {
        messages: {
          ...messages,
          $vuetify: vuetifyMessages
        },
        maxLastModified
      }
    })()

    localeCache.set(locale, pending)

    try {
      return await pending
    } catch (error) {
      if (localeCache.get(locale) === pending) {
        localeCache.delete(locale)
      }

      throw error
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({ status: 400, message: String(error) })
  }
}

// this is used to get the $t function server-side
export async function getTranslator(locale?: string) {
  locale = locale || publicSettings.instance_locale
  const { messages } = await getLocaleMessages(locale)

  const i18n = createI18n({
    legacy: false,
    locale,
    messages: {
      [locale]: messages
    },
    fallbackWarn: false,
    missingWarn: false,
    warnHtmlMessage: false,
    escapeParameter: true,
    escapeParameterHtml: true
  })

  return i18n.global.t.bind(i18n.global)
}