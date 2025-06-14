<script setup>

const props = defineProps({ event: { type: Object, default: () => ({})}})

const { $notify } = useNuxtApp()

const message = ref('')
const loading = ref(false)
const { data: messages, refresh } = useFetch( () => `/event/messages/${event.id}` )

async function sendMessage(is_author_visible) {
  try {
    loading.value = true
    await $fetch(`/event/messages/${props.event.id}`, {
      method: 'POST', body: { is_author_visible, message }
    })
    message.value = ''
    loading.value = false
    refresh()
  } catch (e) {
    $notify(e)
    loading.value = false
    console.error(e)
  }
}
</script>
<template>
    <v-card class="eventModeration">
        <v-card-title>{{$t('common.moderation')}} <v-spacer /><v-btn text label icon @click="$emit('close', false)" size='small'><v-icon v-text="mdiChevronRight"/></v-btn></v-card-title>
        <v-card-text class="d-flex flex-column flex-grow-1 overflow-auto">
            <v-textarea :label="$t('event.message')" :hint="$t(isAdmin ? 'event.message_hint' : 'event.message_author_hint')" persistent-hint v-model='message' rows="2" class="mb-2"/>
            <template v-if="isAdmin">
                <v-btn class='mb-1' outlined :disabled='!message || loading' :loading='loading' @click="sendMessage(false)" color="primary">{{$t('event.send_to_admins')}}</v-btn>
                <v-btn v-if='!event.isAnon' class='mb-1' outlined :disabled='!message || loading' :loading='loading' @click="sendMessage(true)" color="primary">{{$t('event.send_to_author_too')}}</v-btn>
            </template>
            <v-btn v-else small outlined :disabled='!message || loading' :loading='loading' @click="sendMessage(true)" color="primary">send</v-btn><br/>
            <v-list dense class='messageList'>
                <v-list-item v-for="(item, index) in messages" :key="index" class="px-2" :class="item.author">
                    <v-list-item-content>
                        <span v-if="item?.message">{{ item.message }}</span>
                        <v-list-item-subtitle class="font-weight-light">{{ $time.format(item.createdAt, 'EEEE d MMMM HH:mm') }} / {{ item.author }}</v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-card-text>
    </v-card>
</template>

<style>
.eventModeration {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.eventModeration .messageList {
    overflow-y: auto;
    flex-grow: 1;
    padding: 0px;
    margin: 8px 0;
}

.eventModeration .v-textarea {
    flex-grow: 0;
}

.eventModeration .messageList .v-list-item {
    border-top: 1px solid rgba(100,100,100,.07);
    word-break: break-word;
}

.eventModeration .messageList .v-list-item.ADMIN {
    background-color: rgba(200,100,100,0.1);
    border-left: 2px solid rgba(255,69,0, 0.3);
}

.eventModeration .messageList .v-list-item.AUTHOR {
    border-left: 2px solid lightblue;
    background-color: rgba(35, 193, 255, 0.1);
}


</style>
