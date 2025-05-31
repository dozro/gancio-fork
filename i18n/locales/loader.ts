import { ca, cs, da, de, en, es, fi, fr, hr, it, nl, pl, pt, tr, sl, sk, sv, srLatn, srCyrl, ro, ru, zhHans } from 'vuetify/locale'

const vuetifyLocales: Record<string, any> = {
  ca, cs, da, de, en, es, fi, fr, hr, it, nl,
  pl, pt, tr, sl, sk, sv, srLatn, srCyrl, ro, ru, zhHans
}
export default defineI18nLocale(async locale => {
  console.error('sono dentro loader di ', locale)
  const messages = await $fetch(`/api/locale/${locale}`).catch(() => {})
  console.error('trovo i messages: ', messages)
  const vuetifyLocale = vuetifyLocales[locale]
  return { ...messages, $vuetify: vuetifyLocale }

})

// export default async (context: any, locale: string) => {
//   try {
//     if (process.server) {
//       return context.$axios.$get(`locale/${locale}`)
//     } else {
//       // cannot use $axios here as plugins have not yet been loaded
//       return fetch(`${window.location.origin}/api/locale/${locale}`).then(ret => ret.json())
//     }
//   } catch (e) {
//     console.error(`Error loading locale ${locale}`, e)
//   }

//   return {}
// }
