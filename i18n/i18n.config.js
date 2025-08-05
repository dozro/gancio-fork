export default defineI18nConfig(() => {
  return {
  // I18n config file (vue-i18n): ./config/i18n.config.ts
    legacy: false,
    // availableLocales: ['en', 'it'],
    // locale: 'en',
    fallbackLocale: 'en',
    fallbackWarn: false,
    warnHtmlMessage: false,
    missingWarn: false,
    silentTranslationWarn: true,
  }
})