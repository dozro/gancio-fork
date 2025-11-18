<script setup lang="ts">

const settings = useState<Settings>('settings')

const loading = ref(false)
const isValid = ref(false)
const { $notify } = useNuxtApp()
const smtp = ref({ auth: {} })
smtp.value = await $fetch('/api/settings/smtp')
smtp.value = Object.assign({ auth: {}, port: undefined }, smtp.value)

const emit = defineEmits(['close'])

const admin_email = manageSetting('admin_email')

async function done (testing: boolean) {
  const tmpSMTP = JSON.parse(JSON.stringify(smtp.value))
  if (!tmpSMTP.auth.user) {
    delete tmpSMTP.auth
  }

  // override past `ignoreTLS` smtp setting
  tmpSMTP.ignoreTLS = false

  tmpSMTP.port = Number(tmpSMTP.port)
  // force encryption based on selected port, see https://framagit.org/les/gancio/-/issues/192
  if (tmpSMTP.secure) {
    if (tmpSMTP.port === 465) {
      tmpSMTP.secure = true
      tmpSMTP.requireTLS = false
    } else {
      tmpSMTP.secure = false
      tmpSMTP.requireTLS = true
    }
  } else {
    // use TLS immediately for port 465
    // this is recommended in nodemailer documentation
    tmpSMTP.secure = tmpSMTP.port === 465
    tmpSMTP.requireTLS = false
  }
  
  try {
    if (testing) {
      loading.value = true
        await $fetch('/api/settings/test_smtp', { method: 'POST', body: { tmpSMTP }})
        $notify('admin.smtp_test_success', Statuses.SUCCESS, { admin_email })
        loading.value = false
      } else {
        await $fetch('/api/settings', { method: 'PUT', body: { key: 'smtp', value: tmpSMTP }})
        emit('close')
      }
    } catch (e) {
      $notify(e, Statuses.ERROR)
    }
}

</script>
<template>
<v-card>
  <v-card-title class="bg-primary">SMTP Email configuration</v-card-title>
  <v-card-text>
    <p class='mb-2' v-html="$t('admin.smtp_description')"></p>
    <v-form v-model="isValid">

      <v-text-field v-model="admin_email"
        :label="$t('admin.admin_email')"
        :hint="$t('admin.admin_email_help')"
        persistent-hint
        :rules="$valid.email" />

      <v-switch v-model="smtp.sendmail"
        :label="$t('admin.smtp_use_sendmail')" />

      <v-row v-if="!smtp.sendmail">
        <v-col cols="12" md="9">
          <v-text-field v-model="smtp.host"
            :label="$t('admin.smtp_hostname')"
            :rules="[$valid.required('admin.smtp_hostname')]" />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            type="number"
            v-model="smtp.port"
            :label="$t('admin.smtp_port')"
            :rules="[$valid.required('admin.smtp_port')]" />
        </v-col>

        <v-col cols="12">
          <v-switch v-model="smtp.secure"
            :label="$t('admin.smtp_secure')" />
        </v-col>

        <v-col md="6">
          <v-text-field v-model="smtp.auth.user"
            :label="$t('common.user')" />
        </v-col>

        <v-col md="6">
          <v-text-field v-model="smtp.auth.pass"
            persistent-hint
            :hint="$t('admin.smtp_password_description')"
            :label="$t('common.password')"
            type="password" />
        </v-col>
      </v-row>

    </v-form>
  </v-card-text>
  <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn color="primary" @click="done(true)" :loading="loading" :disabled="loading || !isValid" outlined>{{$t('admin.smtp_test_button')}}</v-btn>
    <v-btn color="warning" @click="done(false)" outlined>{{$t("common.ok")}}</v-btn>
  </v-card-actions>
</v-card>
</template>
