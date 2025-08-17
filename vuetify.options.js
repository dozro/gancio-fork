// const minifyTheme = require('minify-css-string').default
// import 'material-design-icons-iconfont/dist/material-design-icons.css'
import { ca, cs, de, en, es, fr, it, nl, pl, pt, tr, sk, sv, ro, ru, zhHans  } from 'vuetify/lib/locale/index.mjs'
// import { ca, cs, de, en, es, eu, fr, gl, it, nb, nl, pl, pt, tr, sk, sv, ro, ru, zhHans  } from 'vuetify/lib/locale'

import { aliases, md } from 'vuetify/iconsets/md'
export default () => {
//   const settings = process.server ? (res.locals.settings || {}) : nuxtState.state.settings || {}
//   const is_dark = nuxtState?.state?.localSettings['theme.is_dark'] ?? settings['theme.is_dark']

return {
    // lang: { locales: { ca, cs, de, en, es, eu, fr, gl, it, nb, nl, pl, pt, sk, sv, tr, ro, ru, zhHans } },
    lang: { locales: { ca, cs, de, en, es, fr, it, nl, pl, pt, sk, sv, tr, ro, ru, zhHans } },
    locales: { ca, cs, it, en },
    locale: {
      fallback: 'en',
      messages: { en, it }
    },
    theme: {
      options: {
        customProperties: false,
        variations: false,
        // minifyTheme,
      },
      icons: {
        defaultSet: 'md',
        aliases,
        sets: {
          md,
        },
      },
      // dark: is_dark,
      themes: {
        // dark: settings.dark_colors,
        dark: {
          colors: {
            primary: '#FF6E40', error: '#FF5252', info: '#2196F3', success: '#4CAF50', warning: '#FB8C00',
          }
        },
        light: {
          colors: {
            surface: '#f8f8f8',
            primary: '#FF4500', error: '#FF5252', info: '#2196F3', success: '#4CAF50', warning: '#FB8C00'
          }
        }
      }
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
    },  
  }
}
