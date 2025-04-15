<script setup lang="ts">
import type { FooterLink } from '~/types/settings.js'

const { Settings } = useSettings()
const config = useRuntimeConfig()
const { t } = useI18n()
const showFollowMe = ref<boolean>(false)

const { data: trusted_sources } = await useFetch<APUser[]>('/api/ap_users/trusted', { lazy: true })
const { data: footerLinks } = await useFetch<FooterLink[]>('/api/settings/footerLinks', {
  transform(links) {
    return links.map(link => {
        if (/^https?:\/\//.test(link.href)) {
          return { href: link.href, label: link.label.startsWith('common.') ? t(link.label) : link.label }
        } else {
          return { to: link.href, label: link.label.startsWith('common.') ? t(link.label) : link.label }
        }
      }) as FooterLink[] }
    })

</script>
<template>
  <v-footer class='bg-black' id='footer' aria-label='Footer'>
    
    <!-- follow me dialog -->
    <v-dialog v-model='showFollowMe' destroy-on-close max-width='700px' :fullscreen='$vuetify.display?.mobile'>
      <!-- <FollowMe @close='showFollowMe=false' is-dialog /> -->
    </v-dialog>
    
    <!-- footer links -->
    <v-btn v-for="link in footerLinks" :key="link?.label" color="primary" flat class="ml-1"
      :href="link?.href" :to="link?.to" :target="link?.href && '_blank'">{{ $t(link?.label) }}</v-btn>
    
    <!-- trusted sources -->
    <v-menu v-if="Settings.enable_federation && trusted_sources?.length"
      offset="left bottom" open-on-hover transition="slide-y-transition">
      <template v-slot:activator="{ props }">
        <v-btn class="ml-1" v-bind="props" color="primary" flat>{{ Settings.trusted_sources_label || $t('admin.trusted_sources_label_default') }}</v-btn>
      </template>
      <v-list lines="two" max-width="550">
        <v-list-item lines="two" v-for='instance in trusted_sources' :key="instance.ap_id" target="_blank" :href="instance?.object.url ?? instance?.ap_id">
          <v-avatar>
            <v-img :src="instance.object?.icon.url" />
          </v-avatar>
          <v-list-item-title>{{ instance?.object?.name ?? instance?.object?.preferredUsername }}</v-list-item-title>
          <v-list-item-subtitle>{{ instance?.object?.summary }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-menu>
  
    <v-btn class="ml-1" v-if="Settings.enable_federation" color="primary" flat rel="me" @click.prevent="showFollowMe=true">{{ $t('event.interact_with_me') }}</v-btn>
    <v-spacer />
    <v-btn color="primary" flat href="https://gancio.org" target="_blank" rel="noopener"> Gancio <small>{{ config.public.version }}</small></v-btn>
  </v-footer>
</template>
