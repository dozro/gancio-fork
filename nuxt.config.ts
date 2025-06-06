import { version } from './package.json'
import config from './config.json'
import locales from './i18n/locales/index'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer: {
    host: '0.0.0.0',
    port: 13120
  },
  compatibilityDate: '2024-04-03',
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  modules: [
    '@nuxtjs/i18n',
    "vuetify-nuxt-module",
    'nuxt-auth-utils',
    '@nuxt/eslint',
  ],
  vuetify: {
    vuetifyOptions: './vuetify.options.js'
  },
  i18n: {
    lazy: true,            // enable lazy loading
    // langDir: 'locales/',   // must be set, but won’t be used for actual loading
    // types: 'composition',
    // pages: undefined,
    locales: Object.keys(locales).map(key => ({
      code: key,
      name: locales[key],
      language: locales[key]
    })),
    skipSettingLocaleOnNavigate: true,// 
    bundle: {
      optimizeTranslationDirective: false
    },
    strategy: 'no_prefix',
    defaultLocale: 'en',
    vueI18n: 'i18n.config.js'
  },  
  runtimeConfig: {
    baseurl: config?.baseurl ?? process.env.BASE_URL,
    db_dialect: config?.db?.dialect ?? process.env.DB_DIALECT,
    db_storage: config?.db?.storage ?? process.env.DB_STORAGE,
    user_locale_path: config?.user_locale ?? process.env.USER_LOCALE_PATH,
    // TODO
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