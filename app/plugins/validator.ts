import * as linkify from 'linkifyjs'
export default defineNuxtPlugin((nuxtApp) => {
  const t = nuxtApp.vueApp.$nuxt.$i18n.t

  const validators = {
    required: (fieldName: string) => (value: unknown) => !!value || t('validators.required', { fieldName: t(fieldName) }),

    password: (value: string) => {
      if (value.length < 8) return 'The password must have at least 8 characters'
      return true
    },

    confirm: (password: string) => (value: string) => password === value || `Password does not match`,

    email: [
      (v: string) => !!v || t('validators.required', { fieldName: t('common.email') }),
      (v: string) => ((v && (v === 'admin' || !!linkify.test(v, 'email'))) || t('validators.email'))
    ]
  }

  nuxtApp.provide('valid', validators)
})
