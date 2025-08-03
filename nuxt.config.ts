import { version } from './package.json'
// import config from './server/config.js'
// import locales from './i18n/locales/index'
// import vuetify from 'vite-plugin-vuetify'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer: {
    host: '0.0.0.0',
    port: 13120
  },
  compatibilityDate: '2025-07-20',
  // 2025-07-20
  
  devtools: {
    enabled: false,
    timeline: {
      enabled: true,
    },
  },
  
  css: ['~/assets/css/main.css'],
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
    locales: [
          { code: 'en', name: 'English', file: 'en.json' },
          { code: 'it', name: 'Italian', file: 'it.json' }
    ],

    // lazy: true,            // enable lazy loading
    // langDir: 'locales/',   // must be set, but won’t be used for actual loading
    // types: 'composition',
    // pages: undefined,
    // locales: Object.keys(locales).map(key => ({
    //   code: key,
    //   name: locales[key],
    //   language: locales[key]
    // })),
    // skipSettingLocaleOnNavigate: true,// 
    // bundle: {
    //   optimizeTranslationDirective: false
    // },
    compilation: {
      strictMessage: false
    },
    strategy: 'no_prefix',
    // vueI18n: 'i18n.config.js'
  },
  vue: {
    compilerOptions: {
      isCustomElement: tag => ['gancio-events', 'gancio-event'].includes(tag)
    }
  },
  runtimeConfig: {
    session: {
      password: process.env?.NUXT_SESSION_PASSWORD ?? '',
      maxAge: 60 * 60 * 24 * 365 // 1 week
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
    // preset: 'node-listener',
    // externals: {
      // inline: ['jose']
    // },
    storage: {
      uploads: {
        driver: "fs",
        base: "./uploads",
      },
    },
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
