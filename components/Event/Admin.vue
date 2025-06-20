<script setup>
const props = defineProps({ event: { type: Object, default: () => ({}) } })
const settings = useState('settings')
const { $confirm, $message } = useNuxtApp()

async function disableAuthor () {
  const ret = await $confirm('event.disable_author_confirm')
  if (!ret) { return }
  try {
    await $fetch(`/api/event/disable_author/${props.event.id}`, { method: 'PUT' })
    $message('Author disabled!')
    props.event.isAnon = true
  } catch (e) {
    $message(e, { color: 'warning' })
  }
}

async function remove (parent = false) {
  const ret = await $confirm(`event.remove_${parent ? 'recurrent_' : ''}confirmation`)
  if (!ret) { return }
  const id = parent ? props.event.parentId : props.event.id
  await $fetch(`/event/${id}`, { method: 'DELETE' })
  navigateTo('/')
}

async function toggle (parent = false) {
  const id = parent ? this.event.parentId : this.event.id
  const is_visible = parent ? this.event.parent.is_visible : this.event.is_visible
  const method = is_visible ? 'unconfirm' : 'confirm'
  try {
    await this.$axios.$put(`/event/${method}/${id}`)
    if (parent) {
      this.event.parent.is_visible = !is_visible
    } else {
      this.event.is_visible = !is_visible
    }
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
<span>
  <v-list density='compact'  nav color="transparent">
    <v-list-group append-icon="mdi-chevron-up" :value="true">
      <template v-slot:activator>
        <v-list-item class="text-overline">{{$t('common.admin_actions')}}</v-list-item>
      </template>

      <!-- Hide / confirm event -->
      <v-list-item
        @click="toggle(false)"
        :icon="event.is_visible ? 'mdi-eye-off' : 'mdi-eye' "
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
        v-if="settings.enable_moderation && !event.isAnon && $auth.user.is_admin" @click="disableAuthor"
        prepend-icon='mdi-account-off'
        :title="$t('event.disable_author')" />

      <!-- Assign to user -->
      <v-list-item
        v-if="event.isAnon && $auth?.user?.is_admin" @click="$emit('openAssignAuthor')"
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
</span>
</template>
