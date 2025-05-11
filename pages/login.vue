<script setup lang="ts">
import { Statuses } from '~/types/settings'

const { loggedIn, user, fetch: refreshSession } = useUserSession()
const { Settings } = useSettings()
const { $notify } = useNuxtApp()

const credentials = reactive({
  email: '',
  password: '',
})

const valid = ref(false)
const loading = ref(false)

async function login() {
  $fetch('/api/login', {
    method: 'POST',
    body: credentials
  })
  .then(async () => {
    // refresh the session on client-side and redirect to the home page
    await refreshSession()
    await navigateTo('/')
  })
  .catch(() => $notify('Bad credentials', Statuses.ERROR))
}

async function forgot () {
  if (!credentials.email) {
    return
  }
  loading.value = true
  try {
    await $fetch('/user/recover', { method: 'POST', body: { email: credentials.email } })
    $notify('login.check_email')
  } catch (e) {
    $notify(e, Statuses.ERROR)
  }
  loading.value = false
}
</script>
<template>
  <v-container class='pa-0 pa-md-3'>
    <v-row class="mt-md-5 ma-0" justify='center'>
      <v-col class='pa-0 pa-md-3' cols='12' md="6" lg="5" xl="4">
        <v-form v-model='valid' ref='form' lazy-validation @submit.prevent='login'>
          <v-card>
            <v-card-title>{{$t('common.login')}}</v-card-title>
            <v-card-subtitle v-text="$t('login.description')" />
            <v-card-text>
                <v-text-field v-model='credentials.email' validate-on-blur :rules='$valid.email'
                autofocus :label='$t("common.email")' />
                
                <v-text-field v-model='credentials.password' :rules='$valid.password'
                type='password' :label='$t("common.password")' />
            </v-card-text>
            
            <v-card-actions>
              <v-btn text
              tabindex="1"
              @click='forgot' small>{{$t('login.forgot_password')}}</v-btn>
            </v-card-actions>
            
            <v-card-actions>
              <v-spacer/>
              
              <v-btn v-if='Settings?.allow_registration'
              to='/register'
              text
              color='orange'>{{$t('login.not_registered')}}</v-btn>
              
              <v-btn color='success'
              type='submit' outlined
              :disabled='!valid || loading' :loading='loading'>{{$t('common.login')}}</v-btn>
            </v-card-actions>
          </v-card>
          
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<!-- <script setup lang="ts">
const valid = ref(false)
const email = ref('')
const password = ref('')

function submit () {
console.error('submit')
}
</script> -->
