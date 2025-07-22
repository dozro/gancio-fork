<script setup lang="ts">
// definePageMeta({ middleware: ['authenticated'] })
// const { loadSettings } = useSettings()
// loadSettings()

const route = useRoute()
console.error(route.params)
const selectedTab = ref(route.params.hash) // route.params.hash !??!

// const { data: users } = await useFetch('/api/users')
const { data: events } = await useFetch('/event/unconfirmed')
const unconfirmedEvents = events?.events
const unconfirmedOldEvents = events?.oldEvents

</script>
<template>
  <v-card>
      <div class="d-flex flex-row">
      <!-- admin alert -->
      <!-- <AdminSetupAlert v-if="isAdmin" /> -->
      <v-tabs direction='vertical' v-model="selectedTab" bg-color="note">
          <!-- <v-tab href="#settings" v-if="isAdmin" value="settings"> {{ $t('common.settings') }}</v-tab> -->
          <v-tab prepend-icon='mdi-cog' href="#settings" value="settings"> {{ $t('common.settings') }}</v-tab>
          <v-tab prepend-icon='mdi-calendar' href="#events" value="events"> {{ $t('common.events') }}</v-tab>
          <v-tab prepend-icon='mdi-account-group' href="#users" value="users"> {{ $t('common.users') }}</v-tab>
          <v-tab prepend-icon='mdi-group' href="#collections" value="collections"> {{ $t('common.collections') }}</v-tab>
          <v-tab prepend-icon='mdi-web' href="#federation" value="federation"> {{ $t('common.federation') }}</v-tab>
          <v-tab href="#moderation" value="moderation"> {{ $t('common.moderation') }}</v-tab>
          <v-tab prepend-icon='mdi-map-marker' href="#places" value="places"> {{ $t('common.places') }}</v-tab>
          <v-tab prepend-icon='mdi-tag-text' href="#tags" value="tags"> {{ $t('common.tags') }}</v-tab>
          <v-tab prepend-icon='mdi-shape' href="#theme" value="theme"> {{ $t('common.theme') }}</v-tab>
          <v-tab prepend-icon='mdi-map' href="#geolocation" value="geolocation"> {{ $t('common.geolocation') }}</v-tab>
          <v-tab prepend-icon='mdi-post-outline' href="#pages" value="pages"> {{ $t('common.pages') }}</v-tab>
          <v-tab prepend-icon='mdi-bullhorn' href="#announcements" value="announcements"> {{ $t('common.announcements') }}</v-tab>
          <v-tab prepend-icon='mdi-toy-brick' href="#plugins" value="plugins"> {{ $t('common.plugins') }}</v-tab>
      </v-tabs>
      
      
          <v-tabs-window v-model="selectedTab">
            <v-tabs-window-item value="settings">
                <AdminSettings />
            </v-tabs-window-item>
            
            <v-tabs-window-item value="users">
              <AdminUsers />
            </v-tabs-window-item>
                              
            <v-tabs-window-item value="events">
              <AdminEvents :unconfirmedEvents='unconfirmedEvents' :unconfirmedOldEvents='unconfirmedOldEvents'
                @confirmed='id => { unconfirmedEvents = unconfirmedEvents.filter(e => e.id !== id); unconfirmedOldEvents = unconfirmedOldEvents.filter(e => e.id !== id)}'
                @removed='id => { unconfirmedEvents = unconfirmedEvents.filter(e => e.id !== id); unconfirmedOldEvents = unconfirmedOldEvents.filter(e => e.id !== id)}' />
            </v-tabs-window-item>
            
            <v-tabs-window-item value='collections'>
              <AdminCollections />
            </v-tabs-window-item>
            
            <v-tabs-window-item value='federation'>
              <AdminFederation />
            </v-tabs-window-item>
            
            <v-tabs-window-item value='moderation'>
              <AdminModeration />
            </v-tabs-window-item>

            <v-tabs-window-item value='places'>
              <AdminPlaces />
            </v-tabs-window-item>
            
            <v-tabs-window-item value='tags'>
              <AdminTags />
            </v-tabs-window-item>
            
            <v-tabs-window-item value='theme'>
              <AdminTheme />
            </v-tabs-window-item>

            <v-tabs-window-item value='geolocation'>
              <AdminGeolocation />
            </v-tabs-window-item>

            <v-tabs-window-item value='announcements'>
              <AdminAnnouncements />
            </v-tabs-window-item>
            
            <v-tabs-window-item value='pages'>
              <AdminPages />
            </v-tabs-window-item>

            <v-tabs-window-item value='plugins'>
              <AdminPlugin />
            </v-tabs-window-item>
          </v-tabs-window>
          </div>
  </v-card>
</template>
