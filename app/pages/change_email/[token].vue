<script setup lang="ts">

const { $notify } = useNuxtApp()
const route = useRoute()
const token = route.params.token
const { loggedIn, fetch: fetchSession } = useUserSession()

const loading = ref(false)

// confirm only on user action, as mail clients could open links in advance
async function confirm() {
  try {
    loading.value = true
    await $fetch('/api/user/change_email_confirm', { method: 'POST', body: { token } })
    $notify('settings.email_changed', Statuses.SUCCESS)
    if (loggedIn.value) {
      await fetchSession()
      navigateTo('/settings')
    } else {
      navigateTo('/login')
    }
  } catch (e) {
    $notify(e, Statuses.ERROR)
  } finally {
    loading.value = false
  }
}
</script>
<template>
<v-container>
  <v-row class='mt-5' align='center' justify='center'>
    <v-col cols='12' md="6" lg="5" xl="4">
      <v-card>
        <v-card-title>{{$t('settings.confirm_email_change')}}</v-card-title>
        <v-card-text>{{$t('settings.confirm_email_change_description')}}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="outlined" :loading='loading' @click='confirm'>{{$t('common.confirm')}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</v-container>
</template>
