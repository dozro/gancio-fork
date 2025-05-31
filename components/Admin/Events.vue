<script setup>
defineProps({
  unconfirmedEvents: { type: Array, default: () => [] },
  unconfirmedOldEvents: { type: Array, default: () => [] },
})

const { $confirm } = useNuxtApp()
const $route = useRoute()
const { t } = useI18n()

const data = reactive({
  openModeration: $route?.query?.moderation ? true : false,
  valid: false,
  dialog: false,
  editing: false,
  selectedEvent: null,
  headers: [
    { value: 'title', text: t('common.title') },
    { value: 'place.name', text: t('common.place'), width: 300 },
    { value: 'start_datetime', text: t('common.when'), width: 300 },
    { value: 'actions', text: t('common.actions'), align: 'right', sortable: false, width: 220 }
  ]
})
  
function edit (event) {
  navigateTo(`/add/${event.id}`)
}

async function confirm (event) {
  try {
    await $fetch(`/event/${event.id}/confirm`, { method: 'PUT' })
    $emit('confirmed', event.id)
    $notify('event.confirmed', { color: 'success' })
  } catch (e) {}
}
    
async function remove (event) {
  const ret = await $confirm('event.remove_confirmation', { event: event.title })
  if (!ret) { return }
  try {
    await $fetch(`/event/${event.id}`, { method: 'DELETE'})
    $notify('admin.event_remove_ok')
    $emit('removed', event.id)
  } catch (e) {}
}
</script>

<template>
<v-container>
  <v-card-title>{{$t('admin.unconfirmed_events')}}</v-card-title>
  <v-card-subtitle>{{$t('admin.event_confirm_description')}}</v-card-subtitle>
  {{unconfirmedEvents}}
  <v-data-table
    v-if='unconfirmedEvents.length'
    :hide-default-footer='unconfirmedEvents.length<10'
    :header-props='{ sortIcon: mdiChevronDown }'
    :footer-props='{ prevIcon: mdiChevronLeft, nextIcon: mdiChevronRight }'
    :items='unconfirmedEvents'
    :headers='headers'>
      <template v-slot:item.start_datetime='{ item }'>{{$time.when(item)}}</template>
    </v-data-table>
    <!-- template(v-slot:item.actions='{ item }')
      t-btn(@click='confirm(item)' color='success' :tooltip="$t('common.confirm')")
        v-icon(v-text='mdiCheckBold')
      t-btn(@click='() => { selectedEvent = item; openModeration=true }' color='warning' :tooltip="$t('common.moderation')")
        v-badge(v-if='item?.n_messages' :content="item?.n_messages" overlap bordered)
          v-icon(v-text='mdiMessageText')
        v-icon(v-else v-text='mdiMessageText')

      t-btn(:to='`/event/${item.slug || item.id}`' color='info' :tooltip="$t('common.preview')")
        v-icon(v-text='mdiEye')
      t-btn(:to='`/add/${item.id}`' color='warning' :tooltip="$t('common.edit')")
        v-icon(v-text='mdiPencil')
      t-btn(@click='remove(item)' color='error' :tooltip="$t('common.delete')")
        v-icon(v-text='mdiDeleteForever') --> 
  
</v-container>
  <!-- //v-navigation-drawer(v-model='openModeration' :fullscreen='$vuetify.display?.mobile' fixed top right width=400 temporary)
  //  EventModeration(:event='selectedEvent' v-if='openModeration' @close='openModeration=false')


  <!-- v-card-title {{$t('common.past_events')}}
  v-data-table(
    v-if='unconfirmedOldEvents.length'
    :hide-default-footer='unconfirmedOldEvents.length<10'
    :header-props='{ sortIcon: mdiChevronDown }'
    :footer-props='{ prevIcon: mdiChevronLeft, nextIcon: mdiChevronRight }'
    :items='unconfirmedOldEvents'
    :headers='headers')
    template(v-slot:item.start_datetime='{ item }') {{$time.when(item)}}
    template(v-slot:item.actions='{ item }')
      template
        t-btn(:to='`/event/${item.slug || item.id}`' color='info' :tooltip="$t('common.preview')")
          v-icon(v-text='mdiArrowRight')
        t-btn(:to='`/add/${item.id}`' color='warning' :tooltip="$t('common.edit')")
          v-icon(v-text='mdiPencil')
        t-btn(@click='remove(item)' color='error' :tooltip="$t('common.delete')")
          v-icon(v-text='mdiDeleteForever') -->
</template>
