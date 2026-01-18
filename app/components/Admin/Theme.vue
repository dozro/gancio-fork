<script setup lang="ts">
import ThemeColorsPicker from './components/ThemeColorsPicker.vue'
import { useTheme } from 'vuetify'

const vTheme = useTheme()

const settings = useState<Settings>('settings')
const { $notify, $confirm } = useNuxtApp()
const linkModalForm = ref()
const link = reactive({ href: '', label: '' })
const valid = ref(false)

const imageKeys = reactive({ logo: 0, header: 0, fallback: 0 })

// <!--
// export default {
//   name: 'Theme',
//   data ({ $store }) {
//     const t = new Date().getMilliseconds()
//     return {
//       mdiDeleteForever, mdiRestore, mdiPlus, mdiChevronUp,
//       valid: false,
//       logoKey: t,
//       fallbackImageKey: t,
//       headerImageKey: t,
//       link: { href: '', label: '' },
//       linkModal: false,
//       dark_menu: [false, false, false, false],
//       light_menu: [false, false, false, false],
//     }
//   },
//   computed: {
//     ...mapState(['settings']),
//     is_dark: {
//       get () { return this.settings['theme.is_dark'] },
//       set (value) {
//         this.$vuetify.theme.dark = value
//         this.setSetting({ key: 'theme.is_dark', value })
//         this.setLocalSetting({ key: 'theme.is_dark', value })
//       }
//     },
//   },
//   methods: {
//     ...mapActions(['setSetting', 'setLocalSetting']),
//     reset () {
//     },

//     updateSettingColor: debounce( async function (theme, color, value) {
//       const key = `${theme}_colors`
//       this.setSetting({ key, value: { ...this.settings[key], [color]: value.hex } })
//     }, 200),

//   } -->
// }

const linkModal = ref(false)
function resetFooterLinks () {
  return $fetch('/api/settings', { method: 'PUT', body: { key: 'footerLinks',
    value: [
      { href: '/', label: 'common.home' },
      { href: '/about', label: 'common.about' }
    ]
}})
}

async function updateColor (theme: "light" | "dark", color: string, value: string) {
  const settingsKey = theme === 'light' ? 'light_colors' : 'dark_colors'
  
  // Update settings
  settings.value[settingsKey][color] = value

  // Update Vuetify theme currently displayed
  if (vTheme.themes.value[theme]) {
    vTheme.themes.value[theme].colors[color] = value
  }

  // And update remote settings
  try {
    await $fetch('/api/settings', { method: 'PUT', body: { key: settingsKey, value: settings.value[settingsKey] } })
  } catch (e) {
    $notify(e, Statuses.ERROR)
  }
}

async function resetHeaderImage () {
  try {
    await $fetch('/api/settings', { method: 'PUT', body: { key: 'header_image', value: null } })
    imageKeys.header++
  } catch (e) {
    $notify(e, Statuses.ERROR)
  }
}

async function resetLogo () {
  try {
    await $fetch('/api/settings', { method: 'PUT', body: { key: 'logo', value: null } })
    imageKeys.logo++
  } catch (e) {
    $notify(e, Statuses.ERROR)
  }
}

async function resetFallbackImage () {
  try {
    await $fetch('/api/settings', { method: 'PUT', body: { key: 'fallback_image', value: null } })
    imageKeys.fallback++
  } catch (e) {
    $notify(e, Statuses.ERROR)
  }
}

function openLinkModal () {
  linkModal.value = true
  linkModalForm.value.reset()
}

function addFooterLink () {
  $fetch('/api/settings', { method: 'PUT', body: {
    key: 'footerLinks',
    value: settings.value.footerLinks.concat(link)
  } })
  link.href = ''
  link.label = ''
  linkModal.value = false
}

async function removeFooterLink (item: FooterLink) {
  const ret = await $confirm('admin.delete_footer_link_confirm')
  if (!ret) { return }
  const footerLinks = settings.value.footerLinks.filter(l => l.label !== item.label)
  return $fetch('/api/settings', { method: 'PUT', body: {
    key: 'footerLinks',
    value: footerLinks
  }})
}

async function moveUpFooterLink (item: FooterLink, idx: number) {
  const footerLinks = [...settings.value.footerLinks]
  footerLinks[idx] = footerLinks[idx-1]
  footerLinks[idx-1] = settings.value.footerLinks[idx]
  return $fetch('/api/settings', { method: 'PUT', body: {
    key: 'footerLinks',
    value: footerLinks
  }})
}

async function editFooterLink (item: FooterLink) {
  link.href = item.href
  link.label = item.label
  linkModal.value = true
}

async function uploadLogo (file: File) {
  const formData = new FormData()
  formData.append('logo', file)
  try {
    await $fetch('/api/settings/logo', { method: 'POST', body: formData })
    imageKeys.logo++
    $notify('Logo updated!')
  } catch (e) {
    $notify(e, Statuses.ERROR)
  }
}

async function uploadFallbackImage (file: File) {
  const formData = new FormData()
  formData.append('fallback_image', file)
  try {
    await $fetch('/api/settings/fallback_image', { method: 'POST', body: formData })
    imageKeys.fallback++
    $notify('Fallback image updated')
  } catch (e) {
    $notify(e, Statuses.ERROR)
  }
}

async function uploadHeaderImage (file: File) {
  const formData = new FormData()
  formData.append('header_image', file)
  try {
    await $fetch('/api/settings/header_image', { method: 'POST', body: formData })
    imageKeys.header++
    $notify('Header image updated!')
  } catch (e) {
    $notify(e, Statuses.ERROR)
  }
}

const is_dark = manageSetting('theme.is_dark')
const hide_thumbs = manageSetting('hide_thumbs')
const hide_calendar = manageSetting('hide_calendar')
const custom_css = manageSetting('custom_css')
const custom_js = manageSetting('custom_js')

</script>

<template>
<div class="d-flex flex-column ga-12 mt-4">

  <div class="d-flex flex-column ga-4">
    <v-switch
      v-model="is_dark"
      hide-details
      persistent-hint
      :hint="$t('admin.is_dark_help')"
      :label="$t('admin.is_dark')"
    />
    <v-switch
      v-model="hide_thumbs"
      hide-details
      :label="$t('admin.hide_thumbs')"
    />
    <v-switch
      v-model="hide_calendar"
      hide-details
      :label="$t('admin.hide_calendar')"
    />
  </div>

  <div>
    <div class="text-h5 mb-2">{{ $t('admin.default_images') }}</div>
    <span class="text-subtitle-2 text-medium-emphasis" v-html="$t('admin.default_images_help')" />
    <div>
      <v-row>
        <v-col cols="4">
          <!-- LOGO -->
          <v-file-input
            class="mt-5"
            ref="upload"
            :label="$t('admin.favicon')"
            @update:modelValue="uploadLogo"
            accept="image/*"
          >
            <template #append>
              <v-btn color="warning" variant='text' @click="resetLogo" prepend-icon='mdi-restore'>
                {{ $t('common.reset') }}
              </v-btn>
            </template>
          </v-file-input>
          <v-img
            class="mt-2"
            :src="`/logo.png?${imageKeys.logo}`"
            max-height="60px"
            contain
          />
        </v-col>

        <v-col cols="4">
          <!-- FALLBACK IMAGE -->
          <v-file-input
            class="mt-5"
            ref="upload"
            :label="$t('admin.fallback_image')"
            persistent-hint
            @update:modelValue="uploadFallbackImage"
            accept="image/*"
          >
            <template #append>
              <v-btn color="warning" variant='text' @click="resetFallbackImage" prepend-icon='mdi-restore'>
                {{$t('common.reset')}}
              </v-btn>
            </template>
          </v-file-input>
          <v-img
            class="mt-2"
            :src="`/fallbackimage.png?${imageKeys.fallback}`"
            max-height="150px"
            contain
          />
        </v-col>

        <v-col cols="4">
          <!-- HEADER IMAGE -->
          <v-file-input
            class="mt-5"
            ref="upload"
            :label="$t('admin.header_image')"
            persistent-hint
            @update:model-value="uploadHeaderImage"
            accept="image/*"
          >
            <template #append>
              <v-btn color="warning" variant='text' @click="resetHeaderImage" prepend-icon='mdi-restore'>
                {{$t('common.reset')}}
              </v-btn>
            </template>
          </v-file-input>
          <v-img
            class="mt-2"
            :src="`/headerimage.png?${imageKeys.header}`"
            max-height="150px"
            contain
          />
        </v-col>
      </v-row>
    </div>

  </div>

  <div>
    <div class="text-h5 mb-4">{{ $t('admin.colors') }}</div>
    <!-- choose theme colors -->

    <div class="d-flex flex-wrap ga-4">
      <theme-colors-picker theme="light" :colors="settings.light_colors" @change="updateColor" />
      <theme-colors-picker theme="dark" :colors="settings.dark_colors" @change="updateColor" />
    </div>

  </div>

  <v-dialog v-model='linkModal' width='500' :fullscreen='$vuetify.display?.mobile'>
    <v-card>
      <v-card-title class="bg-primary">{{$t('admin.footer_links')}}</v-card-title>
      <v-card-text>
        <v-form v-model='valid' ref='linkModalForm'>
          <v-text-field v-model='link.label'
            :rules="[$valid.required('common.label')]"
            label='Label' />
          <v-text-field v-model='link.href'
            :rules="[$valid.required('common.url')]"
            :label="$t('common.url')" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant='outlined' @click='linkModal=false' color='error'> {{$t('common.cancel')}}</v-btn>
        <v-btn variant='outlined' @click='addFooterLink' color='primary' :disabled='!valid'> {{$t('common.add')}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <div>
    <div class="text-h5 mb-4">{{ $t('admin.footer_links') }}</div>
    <div>
      <v-btn color='primary' variant='text' @click='openLinkModal' prepend-icon='mdi-plus'> {{$t('admin.add_link')}}</v-btn>
      <v-btn color='warning' variant='text' @click='resetFooterLinks' prepend-icon='mdi-restore'>{{$t('common.reset')}}</v-btn>
      <v-card>
        <v-list class='mt-1'>
          <v-list-item
            v-for='(link, idx) in settings.footerLinks'
            :key='`${link.label}`' @click='editFooterLink(link)'>

              <v-list-item-title>{{$t(link.label)}}</v-list-item-title>
              <v-list-item-subtitle>{{link.href}}</v-list-item-subtitle>
            <template v-slot:append>
              <v-btn variant='text' size='small' class='left' v-if='idx !== 0' icon='mdi-chevron-up' color='warn' @click.stop='moveUpFooterLink(link, idx)' />
              <v-btn variant='text' size='small' class='float-right' icon='mdi-delete-forever' color='error' @click.stop='removeFooterLink(link)' />
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </div>
  </div>

  <div>
    <div class="text-h5 mb-2">{{ $t('admin.custom_js') }}</div>
    <div class="text-subtitle-2 text-medium-emphasis mb-4" v-html="$t('admin.custom_js_help')" />
    <v-textarea v-model='custom_js' :label='$t("admin.custom_js")' variant='outlined' hide-details />
  </div>

  <div>
    <!-- custom css -->
    <div class="text-h5 mb-2">{{ $t('admin.custom_css') }}</div>
    <div class="text-subtitle-2 text-medium-emphasis mb-4" v-html="$t('admin.custom_css_help')" />
    <v-textarea v-model='custom_css' :label='$t("admin.custom_css")' variant='outlined' hide-details />
  </div>
</div>
</template>
