/**
 * @todo cache with httpCache
 */
import merge from 'lodash.merge'
export default defineCachedEventHandler(async event => {
  const log = useLogger('locale')
  const localeStorage = useStorage('locales')
  const customUserLocaleStorage = useStorage('custom_user_locale')
  const locale = event.context.params?.locale

  log.debug('get', locale)

  // check if this locale exists
  if (!locale || !await localeStorage.hasItem(locale + '.json')) {
    throw createError({ status: 404, message: `This locale (${locale}) does not exists!`})
  }
  
  setHeader(event, 'Content-Type', 'application/json')
  
  try {
    
    const fallbackMessages = await localeStorage.getItem('en.json')
    let defaultLocaleMessages

    // check if we have a user custom messages
    if(await customUserLocaleStorage.hasItem(locale + '.json')) {
      defaultLocaleMessages = merge(
        fallbackMessages,
        await localeStorage.getItem(locale + '.json'),
        await customUserLocaleStorage.getItem(locale + '.json'))
    } else {
      defaultLocaleMessages = merge(fallbackMessages, await localeStorage.getItem(locale + '.json'))
    }

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