<script setup lang="ts">
import Settings from '~/components/Core/Settings/Settings.vue'
import SettingsView from '~/components/Core/Settings/SettingsView.vue'
import { type SettingsMenuItem } from '~/components/Core/Settings/types'

const settings = useState<Settings>('settings')

definePageMeta({ middleware: ['authenticated'] })
useHead({
  title: settings.value.title + ' - ' + $t('common.admin')
})

const { isAdmin } = useAuth()

const { data: unconfirmedEvents, refresh } = await useFetch('/api/events/unconfirmed')

const menuItems = computed<SettingsMenuItem[]>(() => [
  {
    value: "events",
    title: $t('common.events'),
    icon: "mdi-calendar",
    badge: unconfirmedEvents.value?.events?.length  || null,
  },
  { value: "users", title: $t('common.users'), icon: "mdi-account-group" },

  { type: "divider" },

  { value: "collections", title: $t('common.collections'), icon: "mdi-group" },
  { value: "places", title: $t('common.places'), icon: "mdi-map-marker" },
  { value: "tags", title: $t('common.tags'), icon: "mdi-tag-text" },
  // { value: "moderation", title: $t('common.moderation') },
  { value: "announcements", title: $t('common.announcements'), icon: "mdi-bullhorn" },
  { value: "pages", title: $t('common.pages'), icon: "mdi-post-outline" },

  { type: "divider" },

  ...(isAdmin.value ? [{ value: "settings", title: $t('common.settings'), icon: "mdi-cog" }] : []),
  { value: "theme", title: $t('common.theme'), icon: "mdi-shape" },
  { value: "federation", title: $t('common.federation'), icon: "mdi-web" },
  { value: "geolocation", title: $t('admin.geolocation'), icon: "mdi-map" },
  { value: "plugins", title: $t('common.plugins'), icon: "mdi-toy-brick" },
]);

</script>
<template>
<v-container>
  <!-- admin alert -->
  <AdminSetupAlert v-if="isAdmin" />

  <div class="mt-md-4 mb-8">
    <Settings :menuItems="menuItems" :title="$t('common.admin')" query-param="view">
      <SettingsView value="settings">
        <AdminSettings />
      </SettingsView>

      <SettingsView value="users">
        <AdminUsers />
      </SettingsView>

      <SettingsView value="events">
        <AdminEvents
          :unconfirmed-events='unconfirmedEvents?.events'
          :unconfirmed-old-events='unconfirmedEvents?.oldEvents'
          @confirmed='refresh'
          @removed='refresh'
        />
      </SettingsView>

      <SettingsView value='collections'>
        <AdminCollections />
      </SettingsView>

      <SettingsView value='federation'>
        <AdminFederation />
      </SettingsView>

      <!-- <SettingsView value='moderation'>
        <AdminModeration />
      </SettingsView> -->

      <SettingsView value='places'>
        <AdminPlaces />
      </SettingsView>

      <SettingsView value='tags'>
        <AdminTags />
      </SettingsView>

      <SettingsView value='theme'>
        <AdminTheme />
      </SettingsView>

      <SettingsView value='geolocation'>
        <AdminGeolocation />
      </SettingsView>

      <SettingsView value='announcements'>
        <AdminAnnouncements />
      </SettingsView>

      <SettingsView value='pages'>
        <AdminPages />
      </SettingsView>

      <SettingsView value='plugins'>
        <AdminPlugin />
      </SettingsView>
    </Settings>
  </div>
</v-container>
</template>
