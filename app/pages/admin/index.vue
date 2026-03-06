<script setup lang="ts">
import type { SettingsMenuItem } from '~/components/Core/Settings/types'
const settings = useState<Settings>('settings')

definePageMeta({ middleware: ['authenticated'] })
useHead({
  title: settings.value.title + ' - ' + $t('common.admin')
})

const { isAdmin } = useAuth()

const { data: unconfirmedEvents, refresh } = await useFetch('/api/events/unconfirmed')

const menuItems = computed<SettingsMenuItem[]>(() => [
  {
    value: 'events',
    title: $t('common.events'),
    icon: 'mdi-calendar',
    badge: unconfirmedEvents.value?.events?.length || null
  },
  { value: 'users', title: $t('common.users'), icon: 'mdi-account-group' },
  { value: 'moderation', title: $t('common.moderation'), icon: 'mdi-scale-balance' },

  { type: 'divider' },

  { value: 'collections', title: $t('common.collections'), icon: 'mdi-group' },
  { value: 'places', title: $t('common.places'), icon: 'mdi-map-marker' },
  { value: 'tags', title: $t('common.tags'), icon: 'mdi-tag-text' },
  { value: 'announcements', title: $t('common.announcements'), icon: 'mdi-bullhorn' },
  { value: 'pages', title: $t('common.pages'), icon: 'mdi-post-outline' },

  { type: 'divider' },

  ...(isAdmin.value ? [{ value: 'settings', title: $t('common.settings'), icon: 'mdi-cog' }] : []),
  { value: 'theme', title: $t('common.theme'), icon: 'mdi-shape' },
  { value: 'federation', title: $t('common.federation'), icon: 'mdi-web' },
  { value: 'geolocation', title: $t('admin.geolocation'), icon: 'mdi-map' },
  { value: 'plugins', title: $t('common.plugins'), icon: 'mdi-toy-brick' }
])

</script>
<template>
<v-container>
  <!-- admin alert -->
  <AdminSetupAlert v-if="isAdmin" />

  <div class="mt-md-4 mb-8">
    <CoreSettings :menu-items="menuItems" :title="$t('common.admin')" query-param="view">
      <CoreSettingsView value="settings">
        <AdminSettings />
      </CoreSettingsView>

      <CoreSettingsView value="users">
        <AdminUsers />
      </CoreSettingsView>

      <CoreSettingsView value="events">
        <AdminEvents
          :unconfirmed-events='unconfirmedEvents?.events'
          :unconfirmed-old-events='unconfirmedEvents?.oldEvents'
          @confirmed='refresh'
          @removed='refresh'
        />
      </CoreSettingsView>

      <CoreSettingsView value='collections'>
        <AdminCollections />
      </CoreSettingsView>

      <CoreSettingsView value='federation'>
        <AdminFederation />
      </CoreSettingsView>

      <CoreSettingsView value='moderation'>
        <AdminModeration />
      </CoreSettingsView>

      <CoreSettingsView value='places'>
        <AdminPlaces />
      </CoreSettingsView>

      <CoreSettingsView value='tags'>
        <AdminTags />
      </CoreSettingsView>

      <CoreSettingsView value='theme'>
        <AdminTheme />
      </CoreSettingsView>

      <CoreSettingsView value='geolocation'>
        <AdminGeolocation />
      </CoreSettingsView>

      <CoreSettingsView value='announcements'>
        <AdminAnnouncements />
      </CoreSettingsView>

      <CoreSettingsView value='pages'>
        <AdminPages />
      </CoreSettingsView>

      <CoreSettingsView value='plugins'>
        <AdminPlugin />
      </CoreSettingsView>
    </CoreSettings>
  </div>
</v-container>
</template>
