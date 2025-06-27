<script setup lang="ts">
import { useTheme } from 'vuetify'
import { Statuses } from '~/types/settings'

const { loggedIn, user, clear } = useUserSession()
const { $notify } = useNuxtApp()
const theme = useTheme()

const { locale, locales, setLocale } = useI18n()

function logout () {
  clear()
  $notify('common.logout_ok', Statuses.SUCCESS)
}

function toggleDark () {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>
<template>
  <div class='d-flex pa-4'>
    <v-btn icon to='/' variant="text">
      <img src='/static/logo.png' height='40'>
    </v-btn>
    
    <v-spacer/>
    
    <div class='d-flex'>

      <v-switch true-icon='mdi-repeat-off' base-color='orange' color='red' false-icon='mdi-repeat' flat :title='$t("common.search")' variant='text' />
      
      <v-btn icon='mdi-magnify' to='/search' :title='$t("common.search")' variant='text' color='info' />
      <v-btn icon="mdi-information" href='/about' :title='$t("common.about")' :aria-label='$t("common.about")' variant="text" />
      
      <v-btn variant="text" icon="mdi-contrast-circle" @click='toggleDark' />

      <!-- language selection menu -->
      <v-menu transition="slide-y-transition">
        <template #activator="{ props }">
          <v-btn variant="text" icon v-bind='props' aria-label='Language'>{{locale}}</v-btn>
        </template>
        <v-list density='compact' max-height="350" width="250">
          <v-list-item v-for='l in locales' :key='l.code' @click.prevent.stop="setLocale(l.code)" :title='l.language' />
          
          <v-list-item target='_blank' href='https://hosted.weblate.org/engage/gancio/'>
            <v-list-item-subtitle v-text='$t("common.help_translate")' />
          </v-list-item>
        </v-list>
      </v-menu>
    
      <!-- auth menu -->
      <v-menu v-if='loggedIn' transition="slide-y-transition">
        <template v-slot:activator="{ props }">
          <v-btn variant="text" class='mr-0' icon="mdi-dots-vertical" v-bind='props' title='Menu' aria-label='Menu' />
        </template>
        <v-list>
          <v-list-item to='/settings'>
            <template v-slot:prepend><v-icon icon='mdi-cog' /></template>
            <v-list-item-title v-text="$t('common.settings')"/>
          </v-list-item>
          
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
