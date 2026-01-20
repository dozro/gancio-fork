<script setup>
const props = defineProps({ event: { type: Object, default: () => ({}) } })
defineEmits(['close'])

const loading = ref(false)
const selectedUser = ref({})
const { data: users } = await useFetch('/api/users')

async function assign () {
  try {
    loading.value = true
    await $fetch('/event/assign_to_author', { method: 'PUT', body: { id: props.event.id, user_id: selectedUser.value } })
    loading.value = false
    // this.$emit('close')
    // this.$root.$message('event.saved', { color: 'success' })
  } catch(e) {
    loading.value = false
    console.error(e)
    // this.$root.$message(e, { color: 'warning' })
  }
}
</script>
<template>
<v-card>
  <v-card-title class="bg-primary">{{$t('event.assign_to_user')}}</v-card-title>
  <v-card-text>
    <p class="mb-2">{{$t('event.assign_to_user_description')}}</p>
    <v-form>
      <v-autocomplete
        v-model='selectedUser'
        :items="users"
        :prepend-inner-icon="mdiAccount"
        hide-no-data
        item-title="email"
        item-value="id"
        placeholder='Choose user'
        :label="$t('common.user')" />
    </v-form>
  </v-card-text>
  <v-card-actions>
    <v-spacer />
    <v-btn color="primary" variant="outlined" :disabled="!selectedUser || loading" :loading="loading" @click='assign'>{{ $t('event.assign_to_user') }}</v-btn>
    <v-btn color="warning" variant="outlined" @click='$emit("close")'>{{ $t('common.close') }}</v-btn>
  </v-card-actions>
</v-card>
</template>
