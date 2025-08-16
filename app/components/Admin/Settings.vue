<script setup lang="ts">
const { locales } = useI18n()
// const filteredTimezones = []

// const instanceSettings = await $fetch('/api/settings')

const title = manageSetting('title')
const description = manageSetting('description')
const instance_timezone = manageSetting('instance_timezone')
const instance_name = manageSetting('instance_name')
const instance_locale = manageSetting('instance_locale')
const allow_registration = manageSetting('allow_registration')
const allow_anon_event = manageSetting('allow_anon_event')
const allow_multidate_event = manageSetting('allow_multidate_event')
const allow_recurrent_event = manageSetting('allow_recurrent_event')
const recurrent_event_visible = manageSetting('recurrent_event_visible')
const allow_event_without_end_time = manageSetting('allow_event_without_end_time')
const allow_online_event = manageSetting('allow_online_event')
const allow_geolocation = manageSetting('allow_geolocation')
const show_download_media = manageSetting('show_download_media')
const enable_moderation = manageSetting('enable_moderation')
const enable_report = manageSetting('enable_report')
const showSMTP = ref(false)

</script>
<template>
<v-container>
    <v-card-title>{{ $t('common.settings') }}</v-card-title>
    <v-card-text>
        
        <v-text-field v-model="title"
          :label="$t('common.title')"
          :hint="$t('admin.title_description')" persistent-hint />
        
        <v-text-field class='mt-5' v-model="description" 
          :label="$t('common.description')"
          :hint="$t('admin.description_description')" persistent-hint />

        <!-- <v-text-field class='mt-5' v-model="instance_name" 
          :label="$t('common.instance_name')"
          :hint="$t('admin.description_description')" persistent-hint /> -->

        <v-autocomplete class="mt-5" 
            v-model="instance_timezone" 
            :label="$t('admin.select_instance_timezone')" :hint="$t('admin.instance_timezone_description')"
            :items="filteredTimezones" persistent-hint placeholder="Timezone, type to search" />

        <v-select class="mt-5" 
            v-model="instance_locale" 
            :label="$t('admin.instance_locale')"
            :hint="$t('admin.instance_locale_description')"
            persistent-hint
            item-title="name"
            item-value="code"
            :items="locales" />

        <v-switch class="mt-4"
            v-model="allow_registration" 
            :label="$t('admin.allow_registration_description')" />

        <v-switch class="mt-1"
            v-model="allow_anon_event" 
            :label="$t('admin.allow_anon_event')" />

        <v-switch class="mt-1" 
            v-model="allow_multidate_event" 
            :label="$t('admin.allow_multidate_event')" />

        <v-switch class="mt-1" 
            v-model="allow_recurrent_event" 
            :label="$t('admin.allow_recurrent_event')" />

        <v-switch class="mt-1" v-if="allow_recurrent_event"
            v-model="recurrent_event_visible" 
            :label="$t('admin.recurrent_event_visible')" />

        <v-switch class="mt-1" 
            v-model="allow_event_without_end_time" 
            :label="$t('admin.allow_event_without_end_time')" />

        <v-switch class="mt-1" 
            v-model="allow_online_event" 
            :label="$t('admin.allow_online_event')" />

        <v-switch class="mt-4" 
            v-model="allow_geolocation" 
            persistent-hint :hint="$t('admin.allow_geolocation_hint')" 
            :label="$t('admin.allow_geolocation')" />

        <v-switch class="mt-4" 
            v-model="show_download_media" 
            persistent-hint :hint="$t('admin.show_download_media_hint')" 
            :label="$t('admin.show_download_media')" />

        <v-switch class="mt-4" 
            v-model="enable_moderation" 
            density='compact'
            persistent-hint :hint="$t('admin.enable_moderation_hint')" 
            :label="$t('admin.enable_moderation')" />

        <v-switch class="mt-4" v-if="enable_moderation"
          persistent-hint
          :hint="$t('admin.enable_report_hint')"
          v-model='enable_report'
          :label="$t('admin.enable_report')" />

        <v-btn variant='outlined' @click='showSMTP=true' color='primary' class="mt-6">
          {{$t('admin.show_smtp_setup')}}
        </v-btn>

  <v-dialog v-model='showSMTP' destroy-on-close max-width='700px' :fullscreen='$vuetify.display?.mobile'>
    <AdminSMTP @close='showSMTP = false' />
  </v-dialog>


    </v-card-text>
</v-container>
</template>