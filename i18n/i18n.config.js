export default defineI18nConfig(() => {
  return {
  // I18n config file (vue-i18n): ./config/i18n.config.ts
    legacy: false,
    availableLocales: ['en', 'it'],
    fallbackLocale: 'en',
    fallbackWarn: false,
    warnHtmlMessage: false
  }
})