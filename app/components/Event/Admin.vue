<script setup>

const props = defineProps({ event: { type: Object, default: () => ({}) } })
const settings = useState('settings')
const { isAdmin } = useAuth()
const { $confirm, $notify } = useNuxtApp()

async function disableAuthor () {
  const ret = await $confirm('event.disable_author_confirm')
  if (!ret) { return }
  try {
    await $fetch(`/api/event/disable_author/${props.event.id}`, { method: 'PUT' })
    $notify('Author disabled!', Statuses.SUCCESS)
    props.event.isAnon = true
  } catch (e) {
    $notify(e, Statuses.WARNING)
  }
}

async function remove (parent = false) {
  const ret = await $confirm(`event.remove_${parent ? 'recurrent_' : ''}confirmation`, { event: props.event?.title })
  if (!ret) { return }
  const id = parent ? props.event.parentId : props.event.id
  try {
    await $fetch(`/api/events/${id}`, { method: 'DELETE' })
  } catch (e) {
    console.error(e)
    $notify(String(e), Statuses.ERROR)
  }
  navigateTo('/')
}

async function toggle (parent = false) {
  const id = parent ? props.event.parentId : props.event.id
  const is_visible = parent ? props.event.parent.is_visible : props.event.is_visible
  const method = is_visible ? 'unconfirm' : 'confirm'
  try {
    await $fetch(`/api/events/${method}/${id}`, { method: 'PUT' })
    if (parent) {
      props.event.parent.is_visible = !is_visible
    } else {
      props.event.is_visible = !is_visible
    }
  } catch (e) {
    console.error(e)
  }
}

const opened = ref(['Admin'])
</script>

<template>
  <v-list density='compact' v-model:opened="opened" >
    <v-list-group value='Admin'>
      <template v-slot:activator="{ props }" >
        <v-list-item class="text-overline" v-bind='props'>{{$t('common.admin_actions')}}</v-list-item>
      </template>

      <!-- Hide / confirm event -->
      <v-list-item
        @click="toggle(false)"
        :icon="event?.is_visible ? 'mdi-eye-off' : 'mdi-eye' "
        :title="$t(`common.${event.is_visible?(event.parentId?'skip':'hide'):'confirm'}`)" />

      <!-- Edit event -->
      <v-list-item :to="`/add/${event.id}`" prepend-icon='mdi-calendar-edit' :title="$t('common.edit')" />

      <!-- Clone -->
      <v-list-item
        v-if="!event.parentId" :to="`/add/${event.id}?clone=true`"
        prepend-icon='mdi-scanner'
        :title="$t('common.clone')" />

      <!-- Remove -->
      <v-list-item
        v-if="!event.parentId" @click="remove(false)"
        prepend-icon='mdi-delete'
        :title="$t('common.remove')" />

      <!-- Moderation -->
      <v-list-item
        v-if="settings.enable_moderation" @click="$emit('openModeration')"
        prepend-icon='mdi-message-text-outline'
        :title="$t('common.moderation')">
        <template #append-icon v-if="event?.n_messages">
          <v-chip size='small' label class="bg-primary">{{event?.n_messages}}</v-chip>
        </template>
      </v-list-item>

      <!-- Disable author -->
      <v-list-item
        v-if="settings.enable_moderation && !event.isAnon && isAdmin" @click="disableAuthor"
        prepend-icon='mdi-account-off'
        :title="$t('event.disable_author')" />

      <!-- Assign to user -->
      <v-list-item
        v-if="event.isAnon && isAdmin" @click="$emit('openAssignAuthor')"
        prepend-icon='mdi-clipboard-account'
        :title="$t('event.assign_to_user')" />


      <!-- Recurring events -->
      <template v-if="event.parentId">
      
        <v-list-item class="text-overline">
          <span v-html="$t('common.recurring_event_actions')" />
        </v-list-item>

        <!-- Pause / Start to generate recurring event -->
        <v-list-item 
          @click="toggle(true)"
          :prepend-icon="event.parent.is_visible ? 'mdi-pause' : 'mdi-play'"
          :title="$t(`common.${event.parent.is_visible ? 'pause': 'start'}`)" />

        <!-- Edit event -->
        <v-list-item
          :to="`/add/${event.parentId}`"
          prepend-icon='mdi-calendar-edit'
          :title="$t('common.edit')" />

        <!-- Remove -->
        <v-list-item
          @click="remove(true)"
          prepend-icon='mdi-delete-forever'
          :title="$t('common.remove')" />
          
      </template>
    </v-list-group>
  </v-list>
</template>
