<script setup lang="ts">
const $auth = { loggedIn: true, user: { is_admin: true, role: 'admin', is_editor: true } }

import { useTheme } from 'vuetify'

const theme = useTheme()

const { locale, locales, setLocale } = useI18n()

function logout () {
  
}

function toggleDark () {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>
<template>
  <div class='d-flex pa-4'>
    <v-btn icon nuxt to='/' variant="text">
      <img src='/static/logo.png' height='40' />
    </v-btn>
    
    <v-spacer/>
    
    <div class='d-flex'>

      <v-btn icon="mdi-information" href='/about' :title='$t("common.about")' :aria-label='$t("common.about")' variant="text" />
      <v-btn variant="text" icon="mdi-contrast-circle" @click='toggleDark' />

      <!-- language selection menu -->
      <client-only>
        <v-menu offset-y transition="slide-y-transition">
          <template v-slot:activator="{ props }">
            <v-btn variant="text" icon large v-bind='props' aria-label='Language' v-text="locale" />
          </template>
          <v-list dense max-height="300" width="200">
            <v-list-item v-for='locale in locales' @click.prevent.stop="setLocale(locale.code)" :key='locale.code'>
              <v-list-item-title v-text='locale.language' />
            </v-list-item>
            <v-list-item nuxt target='_blank' href='https://hosted.weblate.org/engage/gancio/'>
              <v-list-item-subtitle v-text='$t("common.help_translate")' />
            </v-list-item>
          </v-list>
        </v-menu>
        <template #fallback>
          <v-btn variant="text" large  icon arial-label='Language'>{{locale}}</v-btn>
        </template>
      </client-only> 
      
      <!-- auth menu -->
      <client-only>
        <v-menu v-if='$auth.loggedIn' offset-y transition="slide-y-transition">
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
            
            <v-list-item v-if='$auth.user.is_admin || $auth.user.is_editor' nuxt to='/admin'>
              <template v-slot:prepend><v-icon icon='mdi-account' /></template>
              <v-list-item-title v-text="$t(`common.${$auth.user.role}`)" />
            </v-list-item>
            
            <v-list-item @click='logout'>
              <template v-slot:prepend><v-icon icon='mdi-logout' /></template>
              <v-list-item-title v-text="$t('common.logout')" />
            </v-list-item>
          </v-list>
        </v-menu>
        <template #placeholder>
          <v-btn variant="text" v-if='$auth.loggedIn' large icon="mdi-dots-vertical" aria-label='Menu' title='Menu' />
        </template>
      </client-only>
      
      <!-- login button -->
      <v-btn variant="text" class='mr-0' v-if='!$auth.loggedIn' icon="mdi-login" nuxt  to='/login' :title='$t("common.login")' :aria-label='$t("common.login")' />
    </div>
  </div>
</template>