<script setup lang="ts">
const settings = useState<Settings>('settings')
const { locale } = useI18n()

const { autoDetectTheme } = useAppTheme()

useHead ({
  htmlAttrs: {
    lang: locale.value
  },
  link: [
    { rel: 'icon', type: 'image/png', href: settings.value.baseurl + '/logo.png' },
    { rel: 'stylesheet', href: settings.value.baseurl + '/custom_css' }
  ],
  script: [
    { src: '/gancio-events.es.js', async: true, defer: true, tagPosition: 'bodyClose' },
    { type: 'application/javascript', async: true, src: '/custom_js', defer: true, tagPosition: 'bodyClose' }
  ]
})

onMounted(() => {
  autoDetectTheme()
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
<style>
ul {
  padding-left: 2rem;
}
</style>
