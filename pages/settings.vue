<script setup>
const loading = ref(false)
definePageMeta({
  middleware: ['authenticated'],
})

const { user, clear: clearSession } = useUserSession()

async function forgot () {
  loading.value = true
  await $fetch('/user/recover', { method: 'POST', body: { email: user.email } })
  loading.value = false
  $notify('login.check_email')
}

async function remove_account () {
//   // const ret = await this.$root.$confirm('settings.remove_account_confirm', { color: 'error' })
//   // if (!ret) return
//   // this.$axios.$delete('/user')
//   // this.$auth.logout()
//   // this.$router.replace('/')
}

</script>

<template>
  <v-container class="pa-0 pa-md-3">
    <v-card>
      <v-card-title>{{user.email}}</v-card-title>
      <v-card-text>
        <v-container>
          <v-btn @click='forgot'>{{$t('login.forgot_password')}}</v-btn><br/><br/>
          <v-divider />
          <p>{{$t('settings.remove_account')}}</p>
          <v-btn color='warning' @click='remove_account'>{{$t('common.remove')}}</v-btn>
        </v-container>
      </v-card-text>
    </v-card>
  </v-container>
</template>
