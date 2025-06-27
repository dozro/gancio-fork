// export default defineI18nLocale(async (locale) => {
//   console.error('define i18n locale', locale)
//   const messages = await $fetch(`/api/locale/${locale}`)
//   console.error(messages)
//   return { messages } 
// })
// 
// // locales/en/index.ts
import { en as $vuetify } from 'vuetify/locale'
// import welcome from './welcome.json'

const messages = {
  // ...welcome,
  // someKey: 'Some message',
  $vuetify,
}
export default ({ messages })