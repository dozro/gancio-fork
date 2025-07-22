import locales from '~~/i18n/locales/index'
import fs from 'fs'
import path from 'path'
import config from '../../config'

/**
 * @todo cache with httpCache
 */
export default defineCachedEventHandler(async event => {
  const log = useLogger('locale')

  const locale = event.context.params?.locale

  log.info('get ', locale)

  // check if this locale exists
  if (!locale || !locales[locale]) {
    throw createError({ status: 404, message: `This locale (${locale}) does not exists!`})
  }
  
  setHeader(event, 'Content-Type', 'application/json')
  
  try {
    const fileContent = fs.readFileSync(`./i18n/locales/${locale}.json`, 'utf-8');
    const defaultLocaleMessages = JSON.parse(fileContent)
    
    // check if we have a user custom messages
    let customLocaleMessages = {}

    const customLocalePath = config.user_locale && path.resolve(config.user_locale, `${locale}.json`)
    if (config.user_locale && fs.existsSync(customLocalePath)) {
      try {
        customLocaleMessages = await import(customLocalePath, { with: { type: 'json' }})
      } catch (e) {
        log.error(`Error reading custom locale messages: ${e}`)
      }
    }

    Object.assign(defaultLocaleMessages, customLocaleMessages)
    const vuetify = await import(`vuetify/lib/locale/${locale}.js`)
    return Object.assign(defaultLocaleMessages, { $vuetify: vuetify.default })
  } catch (e) {
    throw createError({ status: 400, message: String(e) })
  }
})