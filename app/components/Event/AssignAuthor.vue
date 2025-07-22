<script setup>
const props = defineProps({ event: { type: Object, default: () => ({})}})
const loading = ref(false)
const selectedUser = ref({})
const { data: users } = useFetch('/api/users')

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
    <v-card-title>{{$t('event.assign_to_user')}}</v-card-title>
    <v-card-subtitle>{{$t('event.assign_to_user_description')}}</v-card-subtitle>
    <v-card-text>
      <v-form>
        <v-autocomplete
          v-model='selectedUser'
          :items="users"
          :prepend-inner-icon="mdiAccount"
          hide-no-data
          item-text="email"
          item-value="id"
          placeholder='Choose user'
          :label="$t('common.user')" />
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn color="primary" @click='assign' outlined :disabled="!selectedUser || loading" :loading="loading">{{ $t('event.assign_to_user') }}</v-btn>
      <v-btn color="warning" @click='$emit("close")' outlined>{{ $t('common.close') }}</v-btn>
    </v-card-actions>
  </v-card>
</template>
