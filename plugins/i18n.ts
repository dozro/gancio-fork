export default defineNuxtPlugin(async (nuxtApp) => {
  const { locale, mergeLocaleMessage } = nuxtApp.vueApp.$nuxt.$i18n  

  // Function to load locale messages dynamically
  const loadMessages = async (localeCode: string) => {
    console.error('dentro load message ', localeCode)
    try {
      let messages: Record<string, any> = {}

      // On the server, we use $fetch or $axios to load the translations
      messages = await $fetch(`/api/locale/${localeCode}`)

      // Merge the loaded messages into the current locale
      mergeLocaleMessage(localeCode, messages)
    } catch (error) {
      console.error(`Error loading locale "${localeCode}":`, error)
    }
  }

  // Load messages for the default locale
  await loadMessages(locale.value)

  // Hook to load messages when switching locales
  nuxtApp.hook('i18n:beforeLocaleSwitch', async ({ _oldLocale, newLocale }) => {
    console.error('before locale switch?!?!', _oldLocale, newLocale)
    await loadMessages(newLocale)
    return newLocale
  })
})