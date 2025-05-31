<script setup lang="ts">
// const { Settings, saveSetting } = useSettings()
// const settings = useState('settings')

const instanceSettings = await $fetch('/api/settings')

async function setSetting(key: string, value: string) {
  await $fetch('/api/settings', { method: 'PUT', body: { key, value } })
  instanceSettings[key] = value
    // return saveSetting(key, value)
}

</script>
<template>
    <v-container>
        <v-card-title>{{ $t('common.settings') }}</v-card-title>
        <v-card-text>
            
            <v-text-field :modelValue="instanceSettings.title"
                :label="$t('common.title')"
                @update:model-value="(v: string) => setSetting('title', v)"
                :hint="$t('admin.title_description')" persistent-hint />
            
            <v-text-field class='mt-5' :modelValue="instanceSettings.description" @update:model-value="(v:string) => setSetting('description', v)"
                :label="$t('common.description')"
                :hint="$t('admin.description_description')" persistent-hint />

            <v-autocomplete class="mt-5" 
                :modelValue="instanceSettings.instance_timezone" @update:model-value="(v:string) => setSetting('instance_timezone', v)"
                :label="$t('admin.select_instance_timezone')" :hint="$t('admin.instance_timezone_description')"
                :items="filteredTimezones" persistent-hint placeholder="Timezone, type to search" />

            <v-select class="mt-5" 
                :modelValue="instanceSettings.instance_locale" @update:model-value="(v:string) => setSetting('instance_locale', v)"
                :label="$t('admin.instance_locale')" :hint="$t('admin.instance_locale_description')" persistent-hint :items="locales" />

            <v-switch class="mt-4"
                :modelValue="instanceSettings.allow_registration" @update:model-value="(v:boolean) => setSetting('allow_registration', v)"
                :label="$t('admin.allow_registration_description')" />

            <v-switch class="mt-1"
                :modelValue="instanceSettings.allow_anon_event" @update:model-value="(v:boolean) => setSetting('allow_anon_event', v)"
                :label="$t('admin.allow_anon_event')" />

            <v-switch class="mt-1" 
                :modelValue="instanceSettings.allow_multidate_event" @update:model-value="(v:boolean) => setSetting('allow_multidate_event', v)"
                :label="$t('admin.allow_multidate_event')" />

            <v-switch class="mt-1" 
                :modelValue="instanceSettings.allow_recurrent_event" @update:model-value="(v:boolean) => setSetting('allow_recurrent_event', v)"
                :label="$t('admin.allow_recurrent_event')" />

            <v-switch class="mt-1" v-if="instanceSettings.allow_recurrent_event"
                :modelValue="instanceSettings.recurrent_event_visible" @update:model-value="(v:boolean) => setSetting('recurrent_event_visible', v)"
                :label="$t('admin.recurrent_event_visible')" />

            <v-switch class="mt-1" 
                :modelValue="instanceSettings.allow_event_without_end_time" @update:model-value="(v:boolean) => setSetting('allow_event_without_end_time', v)"
                :label="$t('admin.allow_event_without_end_time')" />

            <v-switch class="mt-1" 
                :modelValue="instanceSettings.allow_online_event" @update:model-value="(v:boolean) => setSetting('allow_online_event', v)"
                :label="$t('admin.allow_online_event')" />

            <v-switch class="mt-4" 
                :modelValue="instanceSettings.allow_geolocation" @update:model-value="(v:boolean) => setSetting('allow_geolocation', v)"
                persistent-hint :hint="$t('admin.allow_geolocation_hint')" 
                :label="$t('admin.allow_geolocation')" />

            <v-switch class="mt-4" 
                :modelValue="instanceSettings.show_download_media" @update:model-value="(v:boolean) => setSetting('show_download_media', v)"
                persistent-hint :hint="$t('admin.show_download_media_hint')" 
                :label="$t('admin.show_download_media')" />

            <v-switch class="mt-4" 
                :modelValue="instanceSettings.enable_moderation" @update:model-value="(v:boolean) => setSetting('enable_moderation', v)"
                persistent-hint :hint="$t('admin.enable_moderation_hint')" 
                :label="$t('admin.enable_moderation')" />

            <v-switch class="mt-4" v-if="instanceSettings.enable_moderation" persistent-hint :hint="$t('admin.enable_report_hint')"
                :modelValue="instanceSettings.enable_report" @update:model-value="(v:boolean) => setSetting('enable_report', v)"
                :label="$t('admin.enable_report')" />


        </v-card-text>
    </v-container>
</template>