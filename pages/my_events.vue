<script setup>

const { t } = useI18n()
// middleware: ['auth'],
const { data: events, refresh } = await useFetch('/api/events/mine')
const { $confirm, $notify } = useNuxtApp()

const search = ref('')

const headers = [
  { value: 'title', text: t('common.title') },
  { value: 'place.name', text: t('common.place') },
  { value: 'start_datetime', text: t('common.when') },
  { value: 'actions', text: t('common.actions'), align: 'right', sortable: false }
]

async function toggle (event) {
  const id = event.id
  const is_visible = event.is_visible
  const method = is_visible ? 'unconfirm' : 'confirm'
  try {
    await $fetch(`/event/${method}/${id}`, { method: 'POST'})
    event.is_visible = !is_visible
  } catch (e) {
    console.error(e)
  }
}

async function remove (event, parent) {
  const ret = await $confirm(`event.remove_${parent ? 'recurrent_' : ''}confirmation`)
  if (!ret) { return }
  await $fetch(`/event/${event.id}`, { method: 'DELETE' })
  refresh()
  $notify('admin.event_remove_ok')
}
</script>

<template>
<v-container class="pa-0">
  <v-card>
    <v-card-title>{{$t('common.my_events')}}</v-card-title>
    <v-card-text class="pa-1 pa-md-3">
      <v-text-field v-model="search" :label="$t('common.search')"/>
      <v-data-table
        v-if='events'
        :items="events" :hide-default-footer='events?.length<10' dense :search="search"
        :headers='headers'>
        <template v-slot:item.data-table-select="{ isSelected, select }">
          <v-simple-checkbox size='small' small dense :on-icon="mdiCheckboxOutline" :off-icon="mdiCheckboxBlankOutline" :value="isSelected" @input="select($event)" />
        </template>
        <template v-slot:item.start_datetime='{ item }'>
          <span v-if='!item.recurrent'>{{$time.when(item)}}</span>
          <span v-else><v-icon color='success' v-text='mdiRepeat' /> {{$time.recurrentDetail({ parent: item }, 'EEEE, HH:mm')}}</span>
        </template>
        <template v-slot:item.actions='{ item }'>
          <template v-if="!item.recurrent">
            <t-btn @click='toggle(item)' v-if='!item.is_visible' color='success' :tooltip="$t('common.confirm')"><v-icon v-text='mdiEye' /></t-btn>
            <t-btn @click='toggle(item)' v-else-if="!item.parentId" color='info' :tooltip="$t('common.hide')"><v-icon v-text='mdiEyeOff' /></t-btn>
            <t-btn @click='toggle(item)' v-else color='info' :tooltip="$t('common.skip')"><v-icon v-text='mdiDebugStepOver' /></t-btn>
            <t-btn :to='`/event/${item.slug || item.id}`' :tooltip="$t('common.preview')"><v-icon v-text='mdiArrowRight' /></t-btn>
          </template>
          <template v-else>
            <t-btn @click='toggle(item)' v-if='!item.is_visible' color='success' :tooltip="$t('common.start')"><v-icon v-text='mdiPlay' /></t-btn>
            <t-btn @click='toggle(item)' v-else color='info' :tooltip="$t('common.pause')"><v-icon v-text='mdiPause' /></t-btn>
          </template>
          <t-btn :to='`/add/${item.id}`' color='yellow' :tooltip="$t('common.edit')"><v-icon v-text='mdiPencil' /></t-btn>
          <t-btn @click='remove(item, item.recurrent)' color='error' :tooltip="$t('common.delete')"> <v-icon v-text='item.recurrent ? mdiDeleteForever : mdiDelete' /></t-btn>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</v-container>
</template>
