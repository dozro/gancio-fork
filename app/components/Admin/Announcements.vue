<script setup lang="ts">
const { t } = useI18n()
const { $notify, $confirm } = useNuxtApp()

const valid = ref(false)
const dialog = ref(false)
const editing = ref(false)
const form = ref()

const loading = ref(false)
const announcement = reactive({ title: '', announcement: '' })
const headers = [
  { value: 'title', title: t('common.title') },
  { value: 'actions', title: t('common.actions'), align: 'end', sortable: false }
]

const { data: announcements, refresh } = await useFetch('/api/announcements')
    
function edit(newAnnouncement) {
  announcement.title = newAnnouncement.title
  announcement.announcement = newAnnouncement.announcement
  announcement.id = newAnnouncement.id
  editing.value = true
  dialog.value = true
}

function openDialog() {
  // form.value.reset()
  editing.value = false
  announcement.title = ''
  announcement.announcement = ''
  dialog.value = true
}

async function toggle(announcement) {
  try {
    announcement.visible = !announcement.visible
    await $fetch(`/api/announcements/${announcement.id}`, { method: 'PUT', body: announcement })
    
    refresh()
    // announcements.value = this.announcements.map(a => a.id === announcement.id ? announcement : a)
    // TODO: update global announcement useState!
    // this.setAnnouncements(cloneDeep(this.announcements.filter(a => a.visible)))
  } catch (e) {
    console.error(e)
  }
}

async function remove(announcement) {
  const ret = await $confirm('admin.delete_announcement_confirm')
  if (!ret) { return }
  await $fetch(`/api/announcements/${announcement.id}`, { method: 'DELETE' })
  $notify('admin.announcement_remove_ok')
}
    
async function save() {
  if (!form.value.validate()) { return }
  loading.value = true
  try {
    if (editing.value) {
      await $fetch(`/api/announcements/${announcement.id}`, { method: 'PUT', body: announcement })
    } else {
      await $fetch('/api/announcements', { method: 'POST', body: announcement })
    }
    refresh()
    // announcement = { title: '', announcement: '' }
    form.value.reset()
    editing.value = false
    dialog.value = false
  } catch (e) {
    $notify(String(e), Statuses.ERROR)
  }
  loading.value = false
}
</script>

<template>
<v-container>
  <v-card-title> {{ $t('common.announcements') }}</v-card-title>
  <v-card-subtitle v-html="$t('admin.announcement_description')" />
  
  <v-dialog v-model='dialog' width='800px' :fullscreen='$vuetify.display?.mobile'>
    <v-card>
      <v-card-title> {{ $t('admin.new_announcement') }}</v-card-title>
      <v-card-text class='px-0'>
        <v-form v-model='valid' ref='form' @submit.prevent='save' validate-on="lazy">
          <v-text-field class='v-col-12' v-model='announcement.title'
            :rules="[$valid.required('common.title')]"
            :label='$t("common.title")' />
          <CoreEditor class='v-col-12' v-model='announcement.announcement' label="Content"
            border no-save max-height='400px' :placeholder="$t('common.description')" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click='dialog = false' color='error' variant='outlined'> {{ $t('common.cancel') }}</v-btn>
        <v-btn @click='save' color='primary' :disabled='!valid || loading' :loading='loading' variant='outlined'> {{ $t(`common.${editing ? 'save' : 'send'}`) }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  
  <v-btn @click='openDialog' variant='text' color='primary' prepend-icon='mdi-plus'> {{ $t('common.add') }}</v-btn>
  <v-card-text>
    <v-data-table
      v-if='announcements.length'
      :hide-default-footer='announcements.length<10'
      :headers='headers'
      :items='announcements'>
      <template v-slot:item.actions='{ item }'>
        <t-btn 
          @click='toggle(item.id)'
          :color='item.visible ? "warning" : "success"'
          :tooltip="item.visible ? $t('common.disable') : $t('common.enable')")
          :icon="item.visible ? 'mdi-eye-off' : 'mdi-eye'" />
        <t-btn @click='edit(item)' color='info' :tooltip="$t('common.edit')" icon='mdi-pencil' />
        <t-btn @click='remove(item)' color='error' :tooltip="$t('common.delete')" icon='mdi-delete-forever' />
      </template>
    </v-data-table>
  </v-card-text>
</v-container>
</template>
