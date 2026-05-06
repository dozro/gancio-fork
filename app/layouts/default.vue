<script setup lang="ts">
const settings = useState<Settings>('settings')
const { locale } = useI18n()

useHead ({
  htmlAttrs: {
    lang: locale.value
  },
  link: [
    { rel: 'icon', type: 'image/png', href: settings.value.baseurl + '/logo.png' },
    { rel: 'stylesheet', href: settings.value.baseurl + '/custom_css' }
  ],
  script: [
    { type: 'application/javascript', async: true, src: '/custom_js', defer: true, tagPosition: 'bodyClose' }
  ]
})

</script>
<template>
<v-app>
  <CoreAppBar />
  <v-main>
    <LazyCoreDialog />
    <slot />
  </v-main>
  <LazyCoreNotification />
  <CoreFooter />
</v-app>
</template>
