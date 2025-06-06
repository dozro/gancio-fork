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
    <v-btn icon nuxt to='/' variant="text">
      <img src='/static/logo.png' height='40'>
    </v-btn>
    
    <v-spacer/>
    
    <div class='d-flex'>

      <v-btn icon="mdi-information" href='/about' :title='$t("common.about")' :aria-label='$t("common.about")' variant="text" />
      <v-btn variant="text" icon="mdi-contrast-circle" @click='toggleDark' />

      <!-- language selection menu -->
      <v-menu offset-y transition="slide-y-transition">
        <template #activator="{ props }">
          <v-btn variant="text" icon large v-bind='props' aria-label='Language'>{{locale}}</v-btn>
        </template>
        <v-list dense max-height="300" width="200">
          <v-list-item v-for='l in locales' :key='l.code' @click.prevent.stop="setLocale(l.code)">
            <v-list-item-title>{{l.language}}</v-list-item-title>
          </v-list-item>
          <v-list-item nuxt target='_blank' href='https://hosted.weblate.org/engage/gancio/'>
            <v-list-item-subtitle v-text='$t("common.help_translate")' />
          </v-list-item>
        </v-list>
      </v-menu>
    
      <!-- auth menu -->
      <client-only>
        <v-menu v-if='loggedIn' offset-y transition="slide-y-transition">
          <template v-slot:activator="{ props }">
            <v-btn variant="text" class='mr-0' large icon="mdi-dots-vertical" v-bind='props' title='Menu' aria-label='Menu' />
          </template>
          <v-list>
            <v-list-item nuxt to='/settings'>
              <template v-slot:prepend><v-icon icon='mdi-cog'></v-icon></template>
              <v-list-item-title v-text="$t('common.settings')"/>
            </v-list-item>
            
            <v-list-item nuxt to='/my_events'>
              <template v-slot:prepend><v-icon icon='mdi-calendar-account'></v-icon></template>
              <v-list-item-title v-text="$t('common.my_events')"/>
            </v-list-item>
            <v-list-item v-if='user?.role === "admin" || user?.role === "editor"' nuxt to='/admin'>
              <template v-slot:prepend><v-icon icon='mdi-account' /></template>
              <v-list-item-title v-text="$t(`common.${user.role}`)" />
            </v-list-item>
            
            <v-list-item @click='logout'>
              <template v-slot:prepend><v-icon icon='mdi-logout' /></template>
              <v-list-item-title v-text="$t('common.logout')" />
            </v-list-item>
          </v-list>
        </v-menu>
        <template #placeholder>
          <v-btn variant="text" v-if='loggedIn' large icon="mdi-dots-vertical" aria-label='Menu' title='Menu' />
        </template>
      </client-only>
      
      <!-- login button -->
      <v-btn variant="text" class='mr-0' v-if='!loggedIn' icon="mdi-login" nuxt  to='/login' :title='$t("common.login")' :aria-label='$t("common.login")' />
    </div>
  </div>
</template>
