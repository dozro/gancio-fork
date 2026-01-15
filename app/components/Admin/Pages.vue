<script setup lang="ts">
const { t } = useI18n()
const { $notify, $confirm } = useNuxtApp()

const form = ref()
const valid = ref(false)
const dialog = ref(false)
const editing = ref(false)
const loading = ref(false)
const headers = [
  { value: 'title', title: t('common.title') },
  { value: 'actions', title: t('common.actions'), align: 'end', sortable: false }
]

const page = reactive({ title: '', content: '' })
const { data: pages, refresh } = await useFetch('/api/pages')

function openDialog () {
  page.title = ''
  page.content = ''
  editing.value = false
  dialog.value = true
}

function edit(p) {
  page.title = p.title
  page.content = p.content
  page.id = p.id
  editing.value = true
  dialog.value = true
}

async function save() {
  if (!form.value.validate()) { return }
  loading.value = true

  try {
    if (editing.value) {
      await $fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        body: page
      })
    } else {
      await $fetch('/api/pages', {
        method: 'POST',
        body: page
      })
    }
    refresh()
    page.title = ''
    page.content = ''
    form.value.reset()
    editing.value = false
    dialog.value = false
  } catch (e) {
    $notify(String(e), Statuses.ERROR)
  }
  loading.value = false
}

async function remove(page) {
  const ret = await $confirm('admin.delete_page_confirm', { title: page.title })
  if (!ret) { return }
  try {
    await $fetch(`/api/pages/${page.id}`, { method: 'DELETE' })
    $notify('admin.page_remove_ok')
    refresh()
  } catch (e) {
    $notify(String(e), Statuses.ERROR)
  }
}

async function toggle(page) {
  try {
    page.visible = !page.visible
    await $fetch(`/api/pages/${page.id}`, {
      method: 'PUT',
      body: page
    })
    refresh()
  } catch (e) {
    $notify(String(e))
  }
}

</script>
<template>
<div class="d-flex flex-column ga-2">
  <v-dialog v-model="dialog" width="800px" :fullscreen="$vuetify.display?.mobile">
    <v-card>
      <v-card-title>{{ $t('admin.new_page') }}</v-card-title>
      <v-card-text class="px-0">
        <v-form v-model="valid" ref="form" @submit.prevent="save" validate-on='lazy'>
          <v-text-field
            class="v-col-12"
            v-model="page.title"
            :rules="[$valid.required('common.title')]"
            :label="$t('common.title')"
          />
          <CoreEditor
            class="v-col-12"
            v-model="page.content"
            label="Content"
            height="250px"
            border
            no-save
            :placeholder="$t('common.description')"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="dialog = false" color="error" variant='outlined'>{{ $t('common.cancel') }}</v-btn>
        <v-btn
          @click="save"
          color="primary"
          :disabled="!valid || loading"
          :loading="loading"
          variant='outlined'
        >{{ $t(`common.${editing ? 'save' : 'send'}`) }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <div class="text-subtitle-2 text-medium-emphasis">{{$t('admin.page_description')}}</div>

  <div class="d-flex justify-end">
    <v-btn @click="openDialog" variant='text' color="primary" prepend-icon='mdi-plus'>
      {{ $t('common.add') }}
    </v-btn>
  </div>

  <div>
    <v-data-table
      v-if="pages.length"
      :hide-default-footer="pages.length<10"
      :headers="headers"
      :items="pages"
    >
      <template v-slot:item.actions="{ item }">
        <t-btn size='small' :small='true' :to="`/p/${item.slug || item.id}`" :tooltip="$t('common.preview')" icon='mdi-arrow-right' />
        <t-btn
          @click="toggle(item)"
          :color="item.visible ? 'warning' : 'success'"
          :tooltip="item.visible ? $t('common.disable') : $t('common.enable')"
          :icon="item.visible ? 'mdi-eye-off' : 'mdi-eye'"
        />
        <t-btn @click="edit(item)" color="info" :tooltip="$t('common.edit')" icon='mdi-pencil' />
        <t-btn @click="remove(item)" color="error" :tooltip="$t('common.delete')" icon='mdi-delete-forever' />
      </template>
    </v-data-table>
  </div>
</div>
</template>
