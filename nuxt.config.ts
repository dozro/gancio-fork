import { version } from './package.json'
import locales from './i18n/locales/index'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer: {
    host: '0.0.0.0',
    port: 13120
  },
  compatibilityDate: '2025-07-20',
  // 2025-07-20
  
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
  sourcemap: {
    server: true,
    client: true,
  },
  css: [
    '~/assets/css/main.css',
    // '@mdi/font/css/materialdesignicons.css',
  ],
  modules: [
    '@nuxt/eslint',
    "vuetify-nuxt-module",
    'nuxt-auth-utils',
    '@nuxtjs/i18n'
  ],
  vuetify: {
    vuetifyOptions: './vuetify.options.js'
  },
  i18n: {
    defaultLocale: 'en',
    lazy: true,            // enable lazy loading
    // langDir: 'locales/',   // must be set, but won’t be used for actual loading
    // types: 'composition',
    pages: undefined,
    locales: Object.keys(locales).map(key => ({
      code: key,
      name: locales[key],
      file: 'en.js'
    })),
    locale: 'en',
    fallbackLocale: 'en',
    // skipSettingLocaleOnNavigate: true,// 
    // dynamicRouteParams: false,
    compilation: {
      strictMessage: false
    },
    strategy: 'no_prefix',
    vueI18n: 'i18n.config.js'
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => ['gancio-events', 'gancio-event'].includes(tag)
    }
  },
  features: {
    inlineStyles: false
  },
  runtimeConfig: {
    session: {
      password: '',
      maxAge: 60 * 60 * 24 * 365, // 1 year,
      cookie: {
        sameSite: 'lax',
        secure: false // process.env.NODE_ENV === 'production',
      },
    },
    public: {
      version
    }
  },
  vite: {
    clearScreen: false,
    define: {
      'process.env.DEBUG': false,
    },
    build: {
      target: 'esnext',
    },
  },
  nitro: {
    storage: {
      locales: {
        driver: 'fs',
        base: './i18n/locales'
      }
    },
    // preset: 'node-listener',
    // externals: {
    //   inline: ['jose', 'yargs'],
    //   external: ['yargs', 'dotenv']
    // },
    esbuild: {
      options: {
        target: 'esnext',
        tsconfigRaw: {
          // See https://github.com/nuxt/nuxt/issues/14126
          //     https://github.com/unjs/nitro/issues/273
          compilerOptions: {
            experimentalDecorators: true,
          },
        },
      },
    },
  },
})
