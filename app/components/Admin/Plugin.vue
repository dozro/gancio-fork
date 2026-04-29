<script setup>

const form = ref()
const loading = ref(false)
const testLoading = ref(false)
const dialog = ref(false)
const valid = ref(true)
const selectedPlugin = ref({})

const { $notify } = useNuxtApp()
const { data: plugins } = await useFetch('/api/plugins')

async function saveSettings (close = true) {
  const ret = await form.value.validate()
  if (!ret) return
  loading.value = true
  await $fetch(`/api/plugins/${encodeURIComponent(selectedPlugin.value.name)}/settings`,
    {
      method: 'PUT',
      body: selectedPlugin.value.settingsValue
    })
  loading.value = false
  if (close) {
    dialog.value = false
  }
}

async function testPlugin() {
  try {
    testLoading.value = true
    await $fetch(`/api/plugins/${encodeURIComponent(selectedPlugin.value.name)}/test`,
      { method: 'POST', body: { settings: selectedPlugin.value.settingsValue } })
    $notify('common.ok', Statuses.SUCCESS)
  }
  catch (e) {
    console.error(e, typeof e)
    $notify(e, Statuses.ERROR)
  }
  testLoading.value = false
}

function setOptions(plugin) {
  selectedPlugin.value = plugin
  dialog.value = true
}
</script>

<template>
<div>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="text-subtitle-2 text-medium-emphasis" v-html="$t('admin.plugins_description')" />

  <v-dialog v-if='selectedPlugin.settingsValue' v-model='dialog' max-width='1200px' :fullscreen='$vuetify.display?.mobile'>
    <v-card>
      <v-card-title> {{ $t('admin.config_plugin') }} - {{ selectedPlugin.name }}</v-card-title>
      <v-card-subtitle>{{ selectedPlugin.description }}</v-card-subtitle>
      <v-card-text>
        <v-form ref='form' v-model='valid'>
          <v-row v-for='(setting, name) in selectedPlugin.settings' :key='name' class='mt-2'>
            <v-col cols="4">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <small v-html='setting.hint' />
            </v-col>
            <v-col cols="8">
              <v-text-field
                v-if='setting.type === "TEXT"' v-model='selectedPlugin.settingsValue[name]'
                type='text' :label='setting.description'
                persistent-hint
                :rules="[setting.required ? $valid.required(name) : true]" />

              <v-text-field
                v-if='setting.type === "NUMBER"' v-model='selectedPlugin.settingsValue[name]'
                type='number'
                :rules="[setting.required ? $valid.required(name) : true]"
                :label='setting.description' />

              <v-select
                v-if='setting.type === "LIST"' v-model='selectedPlugin.settingsValue[name]'
                :rules="[setting.required ? $valid.required(name) : true]"
                :items='setting.items'
                :label='setting.description'
              />
              <v-switch v-if='setting.type === "CHECK"' v-model='selectedPlugin.settingsValue[name]' :label='setting.description' />
            </v-col>
          </v-row>
          <v-switch v-model='selectedPlugin.settingsValue["enable"]' :label="$t('common.enable')" color='primary' />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="outlined" color='primary' :loading='testLoading' :disabled='testLoading' @click='testPlugin'> {{ $t('common.test') }}</v-btn>
        <v-spacer />
        <v-btn variant="outlined" color='warning' @click='dialog = false'> {{ $t('common.close') }}</v-btn>
        <v-btn
          variant="outlined" color='primary' :loading='loading' :disabled='!valid || loading'
          @click='saveSettings'> {{ $t('common.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <div class='d-flex flex-wrap mt-8 ga-4'>
    <v-card
      v-for='plugin in plugins'
      :key='plugin.name'
      :title='plugin.name'
      :subtitle='plugin.description'
      border
      class='flex-1-1 d-flex flex-column'
      width=400
    >
      <v-spacer />
      <v-card-actions>
        <v-icon :icon='plugin.settingsValue?.enable ? "mdi-power-plug" : "mdi-power-plug-off"' :color='plugin.settingsValue?.enable ? "green" : "red"' />
        <a :href='plugin.url' v-text='plugin.url'/>
        <v-spacer />
        <v-btn variant="text" color='primary' @click='setOptions(plugin)'> {{ $t('common.settings') }}</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</div>
</template>
