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
        <!-- <CoreSideBar v-model="openSidebar" /> -->
        <!-- <CoreNavBar @toggleSidebar="openSidebar = !openSidebar" /> -->
        <v-main>
            <NuxtPage />
        </v-main>
        <!-- <CoreDialog /> -->
        <!-- <CoreNotification /> -->
         <CoreFooter />
    </v-app>
</template>

