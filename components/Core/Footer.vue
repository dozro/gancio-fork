<script setup lang="ts">
import type { FooterLink } from '~/types/settings.js'

const settings = useState<Settings>('settings')

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
  <v-footer color='surface' border id='footer' aria-label='Footer' class="flex-grow-0 py-3" >
    
    <!-- follow me dialog -->
    <v-dialog v-model='showFollowMe' destroy-on-close max-width='700px' :fullscreen='$vuetify.display?.mobile'>
      <!-- <FollowMe @close='showFollowMe=false' is-dialog /> -->
    </v-dialog>
    
    <!-- footer links -->
    <v-btn
      v-for="link in footerLinks" :key="link?.label" color="primary" class="ml-1"
      :href="link?.href" :to="link?.to" :target="link?.href && '_blank'">{{ $t(link?.label) }}</v-btn>
    
    <!-- trusted sources -->
    <v-menu
      v-if="settings.enable_federation && trusted_sources?.length"
      offset-y transition="slide-y-transition">
      <template #activator="{ props }">
        <v-btn class="ml-1" v-bind="props" color="primary">{{ settings.trusted_sources_label || $t('admin.trusted_sources_label_default') }}</v-btn>
      </template>
      <v-list lines="two" max-height="300" max-width="550">
        <v-list-item lines="two" v-for='instance in trusted_sources' :key="instance.ap_id" target="_blank" :href="instance?.object.url ?? instance?.ap_id">
          <v-avatar>
            <v-img :src="instance.object?.icon.url" />
          </v-avatar>
          <v-list-item-title>{{ instance?.object?.name ?? instance?.object?.preferredUsername }}</v-list-item-title>
          <v-list-item-subtitle>{{ instance?.object?.summary }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-menu>
  
    <v-btn class="ml-1" v-if="settings.enable_federation" color="primary" rel="me" @click.prevent="showFollowMe=true">{{ $t('event.interact_with_me') }}</v-btn>
    <v-spacer />
    <v-btn color="primary" href="https://gancio.org" target="_blank" rel="noopener"> Gancio <small>{{ config.public.version }}</small></v-btn>
  </v-footer>
</template>
