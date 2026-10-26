<script setup>
const loading = ref(false)
definePageMeta({
  middleware: ['authenticated']
})

const { $confirm, $notify } = useNuxtApp()

const { user, clear: clearSession } = useUserSession()

async function forgot () {
  loading.value = true
  await $fetch('/api/user/recover', { method: 'POST', body: { email: user.value.email } })
  loading.value = false
  $notify('login.check_email')
}

const emailForm = ref()
const new_email = ref('')
const password = ref('')

async function changeEmail () {
  const { valid } = await emailForm.value.validate()
  if (!valid) return
  try {
    loading.value = true
    await $fetch('/api/user/change_email', { method: 'POST', body: { email: new_email.value, password: password.value } })
    emailForm.value.reset()
    $notify('settings.change_email_sent', Statuses.SUCCESS)
  } catch (e) {
    $notify(e, Statuses.ERROR)
  } finally {
    loading.value = false
  }
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
<v-container>
  <v-card>
    <v-card-title class="mb-4">{{ user.email }}</v-card-title>
    <v-card-text>
      <div class="text-h6 mb-4">{{ $t('login.forgot_password') }}</div>
      <v-btn variant="outlined" prepend-icon="mdi-email-outline" @click='forgot'>{{ $t('common.recover_password') }}</v-btn>
      <v-divider class='my-6' />
      <div class="text-h6 mb-4">{{ $t('settings.change_email') }}</div>
      <v-form ref='emailForm' @submit.prevent='changeEmail'>
        <v-text-field v-model='new_email' type='email' :label="$t('settings.new_email')" :rules='$valid.email' />
        <v-text-field v-model='password' type='password' :label="$t('common.password')" :rules="[$valid.required('common.password')]" />
        <v-btn variant="outlined" prepend-icon="mdi-email-edit-outline" type='submit' :loading='loading'>{{ $t('common.send') }}</v-btn>
      </v-form>
      <v-divider class='my-6' />
      <div class="text-h6 mb-4 text-error">{{ $t('settings.danger_section') }}</div>
      <v-alert type="error" :icon="false" :border="false" rounded>
        <div class="mb-3">{{ $t('settings.remove_account') }}</div>
        <v-btn variant='outlined' color='error' @click='removeAccount'>{{ $t('common.remove') }}</v-btn>
      </v-alert>
    </v-card-text>
  </v-card>
</v-container>
</template>
