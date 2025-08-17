<script setup lang="ts">
const settings = useState<Settings>('settings')

definePageMeta({ middleware: ['authenticated'] })
useHead({
  title: settings.value.title + ' - Admin'
})

const { isAdmin } = useAuth()
const route = useRoute()
const selectedTab = ref(route.query.tab) // route.params.hash !??!

watch(selectedTab, () => {
  navigateTo({ query: { tab: selectedTab.value }})
})

const { data: unconfirmedEvents } = await useFetch('/api/events/unconfirmed')

</script>
<template>
<v-container>
  <v-card>
      <div class="d-flex flex-column">
      <!-- admin alert -->
      <AdminSetupAlert v-if="isAdmin" />
      <v-tabs v-model="selectedTab" show-arrows>
          <!-- <v-tab href="#settings" v-if="isAdmin" value="settings"> {{ $t('common.settings') }}</v-tab> -->
          <v-tab v-if='isAdmin' prepend-icon='mdi-cog' value="settings"> {{ $t('common.settings') }}</v-tab>
          <v-tab prepend-icon='mdi-calendar' value="events"> {{ $t('common.events') }}</v-tab>
          <v-tab prepend-icon='mdi-account-group' value="users"> {{ $t('common.users') }}</v-tab>
          <v-tab prepend-icon='mdi-group' value="collections"> {{ $t('common.collections') }}</v-tab>
          <v-tab prepend-icon='mdi-web' value="federation"> {{ $t('common.federation') }}</v-tab>
          <!-- <v-tab value="moderation"> {{ $t('common.moderation') }}</v-tab> -->
          <v-tab prepend-icon='mdi-map-marker' value="places"> {{ $t('common.places') }}</v-tab>
          <v-tab prepend-icon='mdi-tag-text' value="tags"> {{ $t('common.tags') }}</v-tab>
          <v-tab prepend-icon='mdi-shape' value="theme"> {{ $t('common.theme') }}</v-tab>
          <v-tab prepend-icon='mdi-map' value="geolocation"> {{ $t('admin.geolocation') }}</v-tab>
          <v-tab prepend-icon='mdi-post-outline' value="pages"> {{ $t('common.pages') }}</v-tab>
          <v-tab prepend-icon='mdi-bullhorn' value="announcements"> {{ $t('common.announcements') }}</v-tab>
          <v-tab prepend-icon='mdi-toy-brick' value="plugins"> {{ $t('common.plugins') }}</v-tab>
      </v-tabs>
      
      
          <v-tabs-window :modelValue="selectedTab">
            <v-tabs-window-item value="settings">
                <AdminSettings />
            </v-tabs-window-item>
            
            <v-tabs-window-item value="users">
              <AdminUsers />
            </v-tabs-window-item>
                              
            <v-tabs-window-item value="events">
              <AdminEvents :unconfirmedEvents='unconfirmedEvents?.events' :unconfirmedOldEvents='unconfirmedEvents?.oldEvents' />
                <!-- @confirmed='id => { unconfirmedEvents = unconfirmedEvents.filter(e => e.id !== id); unconfirmedOldEvents = unconfirmedOldEvents.filter(e => e.id !== id)}'
                @removed='id => { unconfirmedEvents = unconfirmedEvents.filter(e => e.id !== id); unconfirmedOldEvents = unconfirmedOldEvents.filter(e => e.id !== id)}' /> -->
            </v-tabs-window-item>
            
            <v-tabs-window-item value='collections'>
              <AdminCollections />
            </v-tabs-window-item>
            
            <v-tabs-window-item value='federation'>
              <AdminFederation />
            </v-tabs-window-item>
            
            <!-- <v-tabs-window-item value='moderation'>
              <AdminModeration />
            </v-tabs-window-item> -->

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
</v-container>
</template>
