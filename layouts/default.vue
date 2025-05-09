<script setup>

// const { serviceConfig } = useAuth()
const { loadSettings } = useSettings()
const openSidebar = ref()
const config = useRuntimeConfig()
await loadSettings()

</script>
<template>
    <v-app>
        <CoreAppBar />
        <v-main>
            <NuxtPage />
        </v-main>
        <!-- <CoreDialog /> -->
        <CoreNotification />
        <CoreFooter />
    </v-app>
</template>
