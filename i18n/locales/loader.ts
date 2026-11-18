export default defineI18nLocale(locale =>
  $fetch(`/api/locale/${locale}`)
)
