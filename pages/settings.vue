<script setup>
const loading = ref(false)
definePageMeta({
  middleware: ['authenticated']
})

const { $confirm } = useNuxtApp()

const { user, clear: clearSession } = useUserSession()

async function forgot () {
  loading.value = true
  await $fetch('/api/user/recover', { method: 'POST', body: { email: user.email } })
  loading.value = false
  $notify('login.check_email')
}

async function removeAccount () {
  const ret = await $confirm('settings.remove_account_confirm')
  if (!ret) return
  $fetch('/api/user', { method: 'DELETE' })
  clearSession()
  navigateTo('/')
}

</script>

<template>
  <v-container class="pa-0 pa-md-3">
    <v-card>
      <v-card-title>{{user.email}}</v-card-title>
      <v-card-text>
        <v-container>
          <v-btn @click='forgot'>{{$t('login.forgot_password')}}</v-btn><br><br>
          <v-divider />
          <p>{{$t('settings.remove_account')}}</p>
          <v-btn color='warning' @click='removeAccount'>{{$t('common.remove')}}</v-btn>
        </v-container>
      </v-card-text>
    </v-card>
  </v-container>
</template>
