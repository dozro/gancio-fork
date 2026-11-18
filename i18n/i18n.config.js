export default defineI18nConfig(() => {
  return {
    legacy: false,
    fallbackWarn: false,
    warnHtmlMessage: false,
    escapeParameter: true,
    escapeParameterHtml: true,
    lazy: true,
    missingWarn: false,
    silentTranslationWarn: true
  }
})
