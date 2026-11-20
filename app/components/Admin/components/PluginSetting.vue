<script setup lang="ts">
import type { GancioPluginSetting } from '~~/server/services/plugins'

const props = defineProps<{
  name: string
  setting: GancioPluginSetting
}>()

const value = defineModel<unknown>()

// ARRAY: each entry is an object with the settings of props.setting.settings
const entries = computed(() => (value.value ?? []) as Record<string, unknown>[])
const openEntry = ref<number>()

// the first setting of an entry is used as title
const titleKey = computed(() => Object.keys(props.setting.settings ?? {})[0] ?? '')

function addEntry() {
  value.value = [...entries.value, {}]
  openEntry.value = entries.value.length - 1
}

function removeEntry(idx: number) {
  value.value = entries.value.filter((_, i) => i !== idx)
}
</script>
<template>
<v-row>
  <v-col :cols="setting.type === 'CHECK' ? 9 : 12" :sm="setting.type === 'ARRAY' ? 12 : 8">
    <div :id="`plugin-option-${name}`" class="text-subtitle-2 font-weight-bold">
      {{ setting.description }}
      <template v-if="setting.required">*</template>
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-if="setting.hint" class="text-body-2 font-weight-normal mt-1" v-html="setting.hint" />
  </v-col>
  <v-col :cols="setting.type === 'CHECK' ? 3 : 12" :sm="setting.type === 'ARRAY' ? 12 : 4">
    <v-text-field
      v-if="setting.type === 'TEXT'"
      v-model="value"
      variant="outlined"
      density="comfortable"
      :rules="[setting.required ? $valid.required(name) : true]"
      :clearable="!setting.required"
      :aria-labelled-by="`plugin-option-${name}`"
      hide-details="auto"
    />

    <v-text-field
      v-else-if="setting.type === 'URL'"
      v-model="value"
      type="url"
      variant="outlined"
      density="comfortable"
      :rules="[$valid.url(setting.required)]"
      :clearable="!setting.required"
      :aria-labelled-by="`plugin-option-${name}`"
      hide-details="auto"
    />

    <v-number-input
      v-else-if="setting.type === 'NUMBER'" v-model="value"
      variant="outlined"
      density="comfortable"
      :rules="[setting.required ? (value) => value === 0 || $valid.required(name)(value) : true]"
      :required="true"
      :min="setting.min"
      :max="setting.max"
      :clearable="!setting.required"
      :aria-labelled-by="`plugin-option-${name}`"
      hide-details="auto"
    />

    <v-select
      v-else-if="setting.type === 'LIST'" v-model="value"
      variant="outlined"
      density="comfortable"
      :rules="[setting.required ? $valid.required(name) : true]"
      :clearable="!setting.required"
      :items="setting.items"
      :aria-labelled-by="`plugin-option-${name}`"
      hide-details="auto"
    />

    <div v-else-if="setting.type === 'CHECK'" class="d-flex justify-end align-center h-100">
      <v-switch
        v-model="value"
        :aria-labelled-by="`plugin-option-${name}`"
        hide-details="auto"
      />
    </div>

    <template v-else-if="setting.type === 'ARRAY'">
      <v-expansion-panels v-model="openEntry" variant="accordion" :aria-labelled-by="`plugin-option-${name}`">
        <!-- eager: validate the settings of collapsed entries too -->
        <v-expansion-panel v-for="(entry, idx) in entries" :key="idx" eager>
          <v-expansion-panel-title>
            {{ entry[titleKey] || `#${idx + 1}` }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <template v-for="(entrySetting, entryName, entryIdx) in setting.settings" :key="entryName">
              <v-divider v-if="entryIdx > 0" class="my-1" />
              <PluginSetting v-model="entry[entryName]" :name="`${name}.${idx}.${entryName}`" :setting="entrySetting" />
            </template>
            <div class="d-flex justify-end">
              <v-btn variant="text" color="error" prepend-icon="mdi-delete-outline" @click="removeEntry(idx)">
                {{ $t('common.remove') }}
              </v-btn>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <v-btn variant="tonal" prepend-icon="mdi-plus" class="mt-2" @click="addEntry">
        {{ $t('common.add') }}
      </v-btn>
    </template>
  </v-col>
</v-row>
</template>
