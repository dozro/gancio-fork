export default defineI18nConfig(() => {
  return {
  // I18n config file (vue-i18n): ./config/i18n.config.ts
    // locales: [
    //   { code: 'en', name: 'English', file: 'en.js' },
    //   { code: 'it', name: 'Italian', file: 'en.js' },
    //   { code: 'fr', name: 'Francais', file: 'en.js' }
    // ],
    legacy: false,
    lazy: true,
    // availableLocales: ['en', 'it', 'fr'],
    // locales: ['en', 'fr', 'it'],
    locale: 'en',
    fallbackLocale: 'en',
    fallbackWarn: false,
    warnHtmlMessage: false,
    missingWarn: false,
    silentTranslationWarn: true,
  }
})
