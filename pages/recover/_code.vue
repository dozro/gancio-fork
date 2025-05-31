<template>
<v-container>
  <v-form @submit.prevent="change_password" v-model='valid'>
    <v-row class='mt-5' align='center' justify='center'>
      <v-col cols='12' md="6" lg="5" xl="4">
        <v-card>
          <v-card-title>{{$t('common.recover_password')}}</v-card-title>
          <template v-if='user'>
            <v-card-subtitle>{{user.email}}</v-card-subtitle>
            <v-card-text>
              <v-text-field type='password'
                :rules="$validators.password"
                autofocus :placeholder='$t("common.new_password")'
                v-model='new_password' />
            </v-card-text>
          </template>
          <template v-else>
            <v-card-text>
              <v-alert type='error' icon='mdi-alert'>{{$t('recover.not_valid_code')}} <br/> {{ error }}</v-alert>
            </v-card-text>
          </template>

          <v-card-actions>
            <v-spacer />
            <v-btn v-if='user' outlined color='primary' type='submit' :disabled='!valid'>{{$t('common.send')}}</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-form>
</v-container>
</template>
<!-- <script>
import { mapState } from 'vuex'
import { mdiAlert } from '@mdi/js'

export default {
  name: 'Recover',
  async asyncData ({ params, $axios }) {
    const code = params.code
    try {
      const user = await $axios.$post('/user/check_recover_code', { recover_code: code })
      return { user, code }
    } catch (e) {
      return { user: false, error: String(e) }
    }
  },
  data () {
    return { new_password: '', valid: false, mdiAlert }
  },
  computed: mapState(['settings']),
  methods: {
    async change_password () {
      try {
        await $fetch('/api/user/recover', { method: 'POST', body: { recover_code: this.code, password: this.new_password } })
        $notify('common.password_updated')
        navigateTo('/login')
      } catch (e) {
        this.$root.$message(e, { color: 'warning' })
      }
    }
  },
  head () {
    return { title: `${this.settings.title} - Authorize` }
  }
}
</script>
<style>
  h4 img {
    max-height: 40px;
    border-radius: 20px;
    background-color: #333;
    border: 1px solid #333;
  }
</style> -->
