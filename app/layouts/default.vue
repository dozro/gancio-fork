<script setup lang="ts">
const settings = useState<Settings>('settings')
const { locale } = useI18n()

// const custom_script = [{ type: 'application/javascript', defer: true, src: '/custom_js', body: true }]
// const custom_style = [{ rel: 'stylesheet', href: settings.value.baseurl + '/custom_css'}]
useHead ({
    htmlAttrs: {
      lang: locale.value
    },
    link: [
      { rel: 'icon', type: 'image/png', href: settings.value.baseurl + '/logo.png' },
      // ...custom_style
    ],
    script: [
      { src: '/gancio-events.es.js', async: true, defer: true, tagPosition: 'bodyClose' },
      // ...custom_script
    ]
  })

</script>
<template>
  <v-app>
    <CoreAppBar />
    <v-main>
      <CoreDialog />
      <NuxtPage />
    </v-main>
    <CoreNotification />
    <CoreFooter />
  </v-app>
</template>
<style>
ul {
  padding-left: 2rem;
}
</style>