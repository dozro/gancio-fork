<!-- <script setup> -->
// const { serviceConfig } = useAuth()
// const { loadSettings } = useSettings()
// const openSidebar = ref()
// const config = useRuntimeConfig()
// await loadSettings()
<!-- </script> -->
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