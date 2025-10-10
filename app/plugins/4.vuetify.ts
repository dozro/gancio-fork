import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { ca, cs, de, en, es, fr, it, nl, pl, pt, tr, sk, sv, ro, ru, zhHans  } from 'vuetify/lib/locale/index.mjs'

// import 'vuetify/styles'
// import '@mdi/font/css/materialdesignicons.css'

export default defineNuxtPlugin((nuxtApp) => {
  // const isDarkCookie = nuxtApp.ssrContext?.event.cookies.get('theme.is_dark')
  // const isDark = isDarkCookie === 'true'
  // const isDark = true

  const vuetify = createVuetify({
    components,
    directives,
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: { mdi }
    },
    theme: {
      defaultTheme: 'system', // isDark ? 'dark' : 'light',
      themes: {
        dark: {
          dark: true,
          colors: {
            primary: '#FF6E40', error: '#FF5252', info: '#2196F3', success: '#4CAF50', warning: '#FB8C00',
          }
        },
        light: {
          dark: false,
          colors: {
            surface: '#f8f8f8',
            primary: '#FF4500', error: '#FF5252', info: '#2196F3', success: '#4CAF50', warning: '#FB8C00'
          }
        }
      }
    },
    display: {
      mobileBreakpoint: 800
    },
    defaults: {
      global: {
        // variant: 'underlined',
        // elevation: 0,
        // rounded: 0,
      },
      VContainer: {
        maxWidth: 1400
      },
      VDialog: {
        maxWidth: '800',
      },
      VFileInput: {
        prependIcon: '',
        prependInnerIcon: 'mdi-attachment',
        variant: 'underlined'
      },
      VSelect: {
        variant: 'underlined',
      },
      VBtn: {
        elevation: 0,
        ripple: 0
      },
      VTextarea: {
        autocomplete: 'off',
        clearable: false,
        variant: 'underlined'        
      },
      VTextField: {
        autocomplete: 'off',
        clearable: true,
        variant: 'underlined'
      },
      VCombobox: {
        variant: 'underlined',
        autocomplete: 'off',
        clearable: true
      },
      VAutocomplete :{
        VChip: {
          closable: true,
          closeIcon: "mdi-close-circle",
        },
        autocomplete: 'off',
        clearable: true,
        variant: 'underlined'
      },
      VAlert: {
        border: 'start',
        type: 'warning',
        variant: 'tonal',
        rounded: 0
      },
      VSwitch: {
        density: 'compact',
        inset: true,
        color: 'primary',
      },
      VDataTableServer: {
        density: 'compact',
      },
      VDataTableRow: {
        density: 'compact',
        VBtn: {
          variant: 'text',
          tile: true
        }
      },
      VDataTableItem: {
        density: 'compact'
      },
      VCard: {  
        color: 'surface',
        variant: 'flat'
      },
      VFooter: {
        VBtn: {
          variant: 'text'
        }
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})