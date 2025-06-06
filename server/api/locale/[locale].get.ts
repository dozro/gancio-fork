// import locales from '~/i18n/locales/index'
import fs from 'fs'
export default defineEventHandler(async event => {
  const log = useLogger('locale')
  // const merge = require('lodash/merge')
  // const config = require('../../config')
  // const path = require('path')
  // const fs = require('fs')
  // const log = require('../../log')
  const locale = event.context.params?.locale
  log.info('get ', locale)
  // check if this locale exists
  // if (!locales[locale]) {
  //   return res.sendStatus(404)
  // }
  // const defaultLocaleMessages = await import(`../../locales/${locale}.json`, { with: { type: "json" }}) ;
  setHeader(event, 'Content-Type', 'application/json')
  
  const fileContent = fs.readFileSync(`./i18n/locales/${locale}.json`, 'utf-8');
  return fileContent
  // return defaultLocaleMessages
  //     // check if we have a user custom messages
  //     let customLocaleMessages = {}
  
  //     const customLocalePath = config.user_locale && path.resolve(config.user_locale, `${locale}.json`)
  //     if (config.user_locale && fs.existsSync(customLocalePath)) {
  //       try {
  //         customLocaleMessages = require(customLocalePath)
  //       } catch (e) {
  //         log.error(`Error reading custom locale messages: ${e}`)
  //       }
  //     }
  
  //     const ret = merge(defaultLocaleMessages, customLocaleMessages)
  //     return res.json(ret)
  
  //   }     
  // }
  
})