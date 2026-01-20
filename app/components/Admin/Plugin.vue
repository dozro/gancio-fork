<script setup>

const loading = ref(false)
const dialog = ref(false)
const valid = ref(false)
const selectedPlugin = ref({})

const { $notify } = useNuxtApp()
const { data: plugins } = await useFetch('/api/plugins')

async function saveSettings (close = true) {
  loading.value = true
  await $fetch('/api/settings', { method: 'PUT', body: {
    key: 'plugin_' + selectedPlugin.value.name,
    value: selectedPlugin.value.settingsValue
  } })
  loading.value = false
  if (close) {
    dialog.value = false
  }
}

async function testPlugin() {
  await saveSettings(false)
  $fetch(`/api/plugin/test/${selectedPlugin.value.name}`, { method: 'POST' })
    .catch(e => $notify(e, { color: 'warning' }))
}

function setOptions(plugin) {
  selectedPlugin.value = plugin
  dialog.value = true
}
</script>

<template>
<div>
  <div class="text-subtitle-2 text-medium-emphasis" v-html="$t('admin.plugins_description')" />

  <v-dialog v-if='selectedPlugin.settingsValue' v-model='dialog' max-width='1200px' :fullscreen='$vuetify.display?.mobile'>
    <v-card>
      <v-card-title> {{ $t('admin.config_plugin') }} - {{ selectedPlugin.name }}</v-card-title>
      <v-card-text>
        <v-form ref='form' v-model='valid'>
          <v-row v-for='(setting, name) in selectedPlugin.settings' :key='name' class='mt-2'>
            <v-col cols="4">
              <small v-html='setting.hint' />
            </v-col>
            <v-col cols="8">
              <v-text-field
                v-if='setting.type === "TEXT"' v-model='selectedPlugin.settingsValue[name]'
                type='text' :label='setting.description'
                persistent-hint
                :rules="[setting.required ? $valid.required(setting.description) : false]" />

              <v-text-field v-if='setting.type === "NUMBER"' v-model='selectedPlugin.settingsValue[name]' type='number' :label='setting.description' />
              <v-switch v-if='setting.type === "CHECK"' v-model='selectedPlugin.settingsValue[name]' :label='setting.description' />
              <v-select v-if='setting.type === "LIST"' v-model='selectedPlugin.settingsValue[name]' :items='setting.items' :label='setting.description' />
            </v-col>
          </v-row>
          <v-switch v-model='selectedPlugin.settingsValue["enable"]' :label="$t('common.enable')" color='primary' />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="outlined" color='primary' @click='testPlugin'> {{ $t('common.test') }}</v-btn>
        <v-spacer />
        <v-btn variant="outlined" color='warning' @click='dialog = false'> {{ $t('common.close') }}</v-btn>
        <v-btn
          variant="outlined" color='primary' :loading='loading' :disable='!valid || loading'
          @click='saveSettings'> {{ $t('common.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <div class='d-flex flex-wrap mt-8 ga-4'>
    <v-card v-for='plugin in plugins' :key='plugin.name' border width='400' class='flex-1-1 d-flex flex-column'>
      <v-card-title> {{ plugin.name }}</v-card-title>
      <v-card-text>
        <p> {{ plugin.description }}</p>
        <blockquote> author: {{ plugin.author }}</blockquote>
        <a :href='plugin.url' v-text='plugin.url'/>
      </v-card-text>

      <v-spacer />
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" color='primary' @click='setOptions(plugin)'> {{ $t('common.settings') }}</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</div>
</template>
