<script setup lang="ts">

const { loggedIn, user, clear } = useUserSession()
const { $notify } = useNuxtApp()
const theme = useAppTheme()
const route = useRoute()
const settings = useState<Settings>('settings')
const params = useState('params', () => ({ show_recurrent: settings.value.recurrent_event_visible, start: time.startMonth(time.currentYear(),  time.currentMonth()) }))

const { locales, setLocale, t } = useI18n()

function logout () {
  clear()
  $notify('common.logout_ok', Statuses.SUCCESS)
  navigateTo('/')
}

const in_home = computed(() => route.name === 'index')
</script>
<template>
  <div class='d-flex pa-4'>
    <v-btn icon to='/' variant='text'>
      <img :src='`/logo.png`' height='40'>
    </v-btn>
    <v-spacer/>

    <div class='d-flex'>
      <v-switch
        class='mr-2'
        v-if='in_home'
        color='primary'
        true-icon='mdi-repeat'
        false-icon='mdi-repeat-off'
        hide-details
        v-model='params.show_recurrent'
      />

      <!-- TODO <t-btn icon='mdi-magnify' to='/search' tooltip='common.search' /> -->
      <t-btn icon="mdi-information" to='/about' tooltip='common.about' :aria-label='t("common.about")' />

      <t-btn :icon="theme?.theme?.global?.current?.value?.dark ? 'mdi-weather-sunny' : 'mdi-weather-night'" tooltip='common.dark' @click='theme.toggleTheme' />

      <!-- language selection menu -->
      <v-menu transition="slide-y-transition">
        <template #activator="{ props }">
          <v-btn variant='plain' icon='mdi-translate' v-bind='props' aria-label='Language' tooltip='common.language' />
        </template>
        <v-list density='compact' max-height="350" width="250">
          <v-list-item v-for='locale in locales' :key='locale.code' @click.prevent="setLocale(locale.code)" :title='locale.name' />

          <v-list-item target='_blank' href='https://hosted.weblate.org/engage/gancio/'>
            <v-list-item-subtitle v-text='t("common.help_translate")' />
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- auth menu -->
      <v-menu v-if='loggedIn' transition="slide-y-transition">
        <template v-slot:activator="{ props }">
          <v-btn variant="plain" class='mr-0' icon="mdi-dots-vertical" v-bind='props' title='Menu' aria-label='Menu' />
        </template>
        <v-list>
          <v-list-item to='/settings' prepend-icon='mdi-cog' :title="t('common.settings')"/>

          <v-list-item to='/my_events'>
            <template v-slot:prepend><v-icon icon='mdi-calendar-account'/></template>
            <v-list-item-title v-text="$t('common.my_events')"/>
          </v-list-item>
          <v-list-item v-if='user?.role === "admin" || user?.role === "editor"' to='/admin'>
            <template v-slot:prepend><v-icon icon='mdi-account' /></template>
            <v-list-item-title v-text="$t(`common.${user.role}`)" />
          </v-list-item>

          <v-list-item @click='logout'>
            <template v-slot:prepend><v-icon icon='mdi-logout' /></template>
            <v-list-item-title v-text="$t('common.logout')" />
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- login button -->
      <v-btn variant="text" class='mr-0' v-if='!loggedIn' icon="mdi-login"  to='/login' :title='$t("common.login")' :aria-label='$t("common.login")' />
    </div>
  </div>
</template>
