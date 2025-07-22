<script setup>
import get from 'lodash/get'
const { t } = useI18n()
const { $notify, $confirm } = useNuxtApp()

const loading = ref(false)
const dialog = ref(false)
const valid = ref(false)
const tag = ref({})
const newTag = ref('')
const search = ref('')
const headers = [
  { value: 'tag', text: t('common.tag') },
  { value: 'count', text: 'N.' },
  { value: 'actions', text: t('common.actions'), align: 'right' }
]


const { data: tags, refresh } = useFetch('/api/tags')

function editTag(item) {
  tag.value.tag = item.tag
  tag.value.count = item.count
  dialog.value = true
}

async function saveTag () {
  loading.value = true
  if (!form.value.validate()) {
    return
  }

  $fetch('/api/tag', { method: 'PUT', body: { tag: this.tag.tag, newTag: this.newTag } })
  dialog.value = false
  refresh()
  loading.value = false
  $notify('admin.tag_renamed', { oldTag: this.tag.tag, newTag: this.newTag }, { color: 'success' })
  newTag.value = ''
}

async function removeTag (tag) {
  const ret = await $confirm('admin.delete_tag_confirm', { tag: tag.tag, n: tag.count })
  if (!ret) { return }
  try {
    $fetch(`/api/tag/${encodeURIComponent(tag.value.tag)}`)
    refresh()
  } catch (e) {
    const err = get(e, 'response.data.errors[0].message', e)
    $notify(err, { color: 'error' })
    loading.value = false
  }
}    
</script>

<template>
<v-container>
  <v-card-title> {{ $t('common.tags') }}</v-card-title>
    <v-spacer />
    <v-text-field
      v-model='search'
      :append-icon='mdiMagnify' variant='outlined' rounded
      :label="$t('common.search')"
      single-line hide-details />

  <v-dialog v-model='dialog' width='600' :fullscreen='$vuetify.display?.mobile' v-if='dialog'>
    <v-card>
      <v-card-title> {{$t('admin.edit_tag')}} -
        <strong class='ml-2'> {{tag.tag}}</strong>
      </v-card-title>
      <v-card-subtitle> {{$tc('admin.edit_tag_help', tag.count)}}</v-card-subtitle>
      <v-card-text>
        <v-form v-model='valid' ref='form'>
          <v-combobox
            v-model='newTag'
            v-model:search="newTag"
            :prepend-icon="mdiTag"
            hide-no-data
            persistent-hint
            :items="newTag ? tags.filter(t => t.tag.includes(newTag)) : tags"
            :return-object='false'
            item-value='tag'
            item-title='tag'
            :label="$t('common.tag')"
            @keyup.enter='saveTag'>
              <template #item="{ item }">
                <span> "{{item.tag}}" <small>({{item.count}})</small></span>
              </template>
            </v-combobox>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click='dialog = false' variant='outlined' color='warning'> {{ $t('common.cancel') }}</v-btn>
        <v-btn
          @click='saveTag' color='primary' variant='outlined' :loading='loading'
          :disabled='!newTag || loading'> {{ $t('common.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  
  <v-card-text>
    <v-data-table
      :headers='headers'
      :items='tags'
      :hide-default-footer='tags.length < 5'
      :search='search'>
      <template v-slot:item.actions='{ item }'>
        <t-btn @click='editTag(item)' color='primary' :tooltip="$t('common.edit')" icon='mdi-pencil' />
        <t-btn :to='`/tag/${item.tag}`' color='success'  :tooltip="$t('common.preview')" icon='mdi-eye' />
        <t-btn @click='removeTag(item)' color='error' :tooltip="$t('common.delete')" icon='mdi-delete-forever' />
      </template>
    </v-data-table>
  </v-card-text>
</v-container>
</template>
