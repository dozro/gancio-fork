<script setup lang="ts">
const settings = useState<Settings>('settings')
const theme = useTheme()
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
//     hide_thumbs: {
//       get () { return this.settings.hide_thumbs },
//       set (value) { this.setSetting({ key: 'hide_thumbs', value }) }
//     },
//     hide_calendar: {
//       get () { return this.settings.hide_calendar },
//       set (value) { this.setSetting({ key: 'hide_calendar', value }) }
//     },
//     custom_js: {
//       get () { return this.settings.custom_js },
//       set (value) { this.setSetting({ key: 'custom_js', value })}
//     },
//     custom_css: {
//       get () { return this.settings.custom_css },
//       set (value) { this.setSetting({ key: 'custom_css', value })}
//     }    
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
  //       this.setSetting({
  //         key: 'footerLinks',
  //         value: [
  //           { href: '/', label: 'common.home' },
  //           { href: '/about', label: 'common.about' }
  //         ]
  //       })

}

function updateColor (theme, color, value) {
  // this.$vuetify.theme.themes[theme][color] = value.hex
  // this.updateSettingColor(theme, color, value)
}

function resetHeaderImage () {

}
function resetLogo () {
  //       this.setSetting({ key: 'logo', value: null })
//         .then(this.forceLogoReload)
//       e.stopPropagation()
}
function resetFallbackImage () {

}

function openLinkModal () {
  linkModal.value = true
  // this.$nextTick(() => this.$refs.linkModalForm.reset())
}

function addFooterLink () {
  // const link = Object.assign({}, this.link)
  // this.setSetting({ key: 'footerLinks', value: this.settings.footerLinks.concat(link) })
  // // this.link = { href: '', label: '' }
  // this.$refs.linkModalForm.reset()
  linkModal.value = false
}

async function removeFooterLink (item) {
  // const ret = await this.$root.$confirm('admin.delete_footer_link_confirm')
  // if (!ret) { return }
  // const footerLinks = this.settings.footerLinks.filter(l => l.label !== item.label)
  // this.setSetting({ key: 'footerLinks', value: footerLinks })
}

async function moveUpFooterLink (item, idx) {
  // const footerLinks = [...this.settings.footerLinks]
  // footerLinks[idx] = footerLinks[idx-1]
  // footerLinks[idx-1] = this.settings.footerLinks[idx]
  // this.setSetting({ key: 'footerLinks', value: footerLinks })
}

async function editFooterLink (item) {
//       this.link = { href: item.href, label: item.label }
//       this.linkModal = true
}

async function uploadLogo (file: File) {

}

async function uploadFallbackImage (file: File) {
  console.error('upload fallback image')
}

async function uploadHeaderImage (file: File) {
  const formData = new FormData()
  formData.append('headerImage', file)
  try {
    await $fetch('/settings/headerImage', { method: 'POST', body: formData })
  //   this.$root.$emit('message', {
  //     message: 'Header image updated'
  //   })
  //   this.forceHeaderImageReload()
  } catch (e) {}
}

function manageSetting(key: keyof Settings, setCb = null) {
  return computed({
    get: () =>  settings.value[key],
    set: (value) => {
      $fetch('/api/settings', { method: 'PUT', body: { key, value } })
      if (typeof setCb === 'function') { setCb(value) }
      settings.value[key] = value
    }
  })
}

const is_dark = manageSetting('theme.is_dark', () => { theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark' })
const hide_thumbs = manageSetting('hide_thumbs')
const hide_calendar = manageSetting('hide_calendar')
const custom_css = manageSetting('custom_css')
const custom_js = manageSetting('custom_js')

</script>

<template>
<v-container>
  <v-card-title>{{ $t('common.theme') }}</v-card-title>
  <v-card-text>
    <v-switch
      class="mt-5"
      v-model="is_dark"
      inset
      hide-details
      :label="$t('admin.is_dark')"
    />
    <v-switch
      class="mt-5"
      v-model="hide_thumbs"
      inset
      hide-details
      :label="$t('admin.hide_thumbs')"
    />
    <v-switch
      class="mt-5"
      v-model="hide_calendar"
      inset
      hide-details
      :label="$t('admin.hide_calendar')"
    />

    <v-card-title>{{ $t('admin.default_images') }}</v-card-title>
    <v-card-subtitle v-html="$t('admin.default_images_help')" />
    <v-card-text>
      <v-row>
        <v-col cols="4">
          <!-- LOGO -->
          <v-file-input
            class="mt-5"
            ref="upload"
            :label="$t('admin.favicon')"
            @change="uploadLogo"
            accept="image/*"
          >
            <template #append-outer>
              <v-btn color="warning" text @click="resetLogo" prepend-icon='mdi-restore'>
                {{ $t('common.reset') }}
              </v-btn>
            </template>
          </v-file-input>
          <v-img
            class="mt-2"
            :src="`/logo.png`"
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
            @change="uploadFallbackImage"
            accept="image/*"
          >
            <template #append-outer>
              <v-btn color="warning" text @click="resetFallbackImage" prepend-icon='mdi-restore'>
                {{$t('common.reset')}}
              </v-btn>
            </template>
          </v-file-input>
          <v-img
            class="mt-2"
            :src="`/fallbackimage.png`"
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
            @change="uploadHeaderImage"
            accept="image/*"
          >
            <template #append-outer>
              <v-btn color="warning" text @click="resetHeaderImage" prepend-icon='mdi-restore'>
                {{$t('common.reset')}}
              </v-btn>
            </template>
          </v-file-input>
          <v-img
            class="mt-2"
            :src="`/headerimage.png`"
            max-height="150px"
            contain
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-title>{{ $t('admin.colors') }}</v-card-title>
    <!-- choose theme colors -->
    <v-card-text>
      <!-- <v-theme-provider>
        <v-card max-width="465">
          <v-card-text>
            <span class="mr-2" v-for="(color, i) in settings.dark_colors" :key="i">
              <v-menu
                v-model="dark_menu[i]"
                :close-on-content-click="false"
                transition="slide-y-transition"
                offset-y
                top
                right
                max-width="290px"
                min-width="290px"
              >
                <template v-slot:activator="{ on }">
                  <v-btn :color="color" dark small v-on="on">{{ i }}</v-btn>
                </template>
                <v-color-picker
                  mode="hexa"
                  :value="color"
                  @update:color="c => updateColor('dark', i, c)"
                />
              </v-menu>
            </span>
          </v-card-text>
        </v-card>
      </v-theme-provider> -->
    </v-card-text>

    <!-- <v-theme-provider light>
      <v-card class='mt-4' max-width='465'>
        <v-card-text>
          <span class='mr-2' v-for='(color, i) in settings.light_colors' :key='i'>
            <v-menu v-model='light_menu[i]'
                :close-on-content-click="false"
                transition="slide-y-transition"
                offset-y
                top right
                max-width="290px"
                min-width="290px">
              <template v-slot:activator='{ on }'>
                <v-btn :color='color' small v-on='on'> {{i}}</v-btn>
              </template>
              <v-color-picker mode='hexa' :value='color' @update:color='c => updateColor("light", i, c)' />
            </v-menu>
          </span>
        </v-card-text>
      </v-card>
    </v-theme-provider> -->
        
  <v-dialog v-model='linkModal' width='500' :fullscreen='$vuetify.display?.mobile'>
    <v-card>
      <v-card-title> {{$t('admin.footer_links')}}</v-card-title>
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
        <v-btn outlined @click='linkModal=false' color='error'> {{$t('common.cancel')}}</v-btn>
        <v-btn outlined @click='addFooterLink' color='primary' :disabled='!valid'> {{$t('common.add')}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  
  <v-card-title> {{$t('admin.footer_links')}}</v-card-title>
  <v-card-text>
    <v-btn color='primary' variant='text' @click='openLinkModal' prepend-icon='mdi-plus'> {{$t('admin.add_link')}}</v-btn>
    <v-btn color='warning' variant='text' @click='resetFooterLinks' prepend-icon='mdi-restore'>{{$t('common.reset')}}</v-btn>
    <v-card>
      <v-list class='mt-1'>
        <v-list-item
          v-for='(link, idx) in settings.footerLinks'
          :key='`${link.label}`' @click='editFooterLink(link)'>
            
            <v-list-item-title>{{link.label}}</v-list-item-title>
            <v-list-item-subtitle>{{link.href}}</v-list-item-subtitle>
          <template v-slot:append>
            <v-btn size='small' class='left' v-if='idx !== 0' icon='mdi-chevron-up' color='warn' @click.stop='moveUpFooterLink(link, idx)' />
            <v-btn size='small' class='float-right' icon='mdi-delete-forever' color='error' @click.stop='removeFooterLink(link)' />
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-card-text>

  <v-card-title>{{$t('admin.custom_js')}}</v-card-title>
  <v-card-subtitle v-html="$t('admin.custom_js_help')" />
  <v-card-text>
    <v-textarea v-model='custom_js' :label='$t("admin.custom_js")' outlined />
  </v-card-text>

  <!-- custom css -->
  <v-card-title>{{$t('admin.custom_css')}}</v-card-title>
  <v-card-subtitle v-html="$t('admin.custom_css_help')" />
  <v-card-text>
    <v-textarea v-model='custom_css' :label='$t("admin.custom_css")' outlined />
  </v-card-text>
  </v-card-text>
</v-container>
</template>
