/**
 * @todo cache with httpCache
 */
import merge from 'lodash.merge'
export default defineCachedEventHandler(async event => {
  const log = useLogger('locale')
  const localeStorage = useStorage('locales')

  const locale = event.context.params?.locale

  log.debug('get', locale)

  // check if this locale exists
  if (!locale || !await localeStorage.hasItem(locale + '.json')) {
    throw createError({ status: 404, message: `This locale (${locale}) does not exists!`})
  }
  
  setHeader(event, 'Content-Type', 'application/json')
  
  try {
    
    // const fileContent = fs.readFileSync(`./i18n/locales/${locale}.json`, 'utf-8');
    const fallbackMessages = await localeStorage.getItem('en.json')
    const defaultLocaleMessages = merge(fallbackMessages, await localeStorage.getItem(locale + '.json'))
    
    // check if we have a user custom messages
    // let customLocaleMessages = {}

    // const customLocalePath = config.user_locale && path.resolve(config.user_locale, `${locale}.json`)
    // if (config.user_locale && fs.existsSync(customLocalePath)) {
    //   try {
    //     const customLocaleContent = fs.readFileSync(customLocalePath, 'utf-8')
    //     customLocaleMessages = JSON.parse(customLocaleContent)
    //   } catch (e) {
    //     log.error(`Error reading custom locale messages: ${e}`)
    //   }
    // }

    // Object.assign(defaultLocaleMessages, customLocaleMessages)
    // let vuetify
    // try {
    //   vuetify = await import(`vuetify/lib/locale/${locale}.js`)
    // } catch (e) {
    //   vuetify = { default: [] } // await import(`vuetify/lib/locale/en.js`)
    // }
    if (await localeStorage.hasItem('vuetify:' + locale + '.json')) {
      const $vuetify = await localeStorage.getItem('vuetify:' + locale + '.json')
      return Object.assign(defaultLocaleMessages, { $vuetify  })
    } else {
      const $vuetify = await localeStorage.getItem('vuetify:en.json')
      return Object.assign(defaultLocaleMessages, { $vuetify  })      
    }
  } catch (e) {
    throw createError({ status: 400, message: String(e) })
  }
})