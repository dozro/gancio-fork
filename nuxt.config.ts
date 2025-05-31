import { version } from './package.json'
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
    "vuetify-nuxt-module",
    '@nuxtjs/i18n',
    'nuxt-auth-utils',
    '@nuxt/eslint',
  ],
  vuetify: {
    vuetifyOptions: './vuetify.options.js'
  },
  runtimeConfig: {
    base_url: process.env.BASE_URL,
    db_dialect: process.env.DB_DIALECT,
    db_storage: process.env.DB_STORAGE,
    public: {
      version
    }
  },
  i18n: {
    locales: Object.keys(locales).map((key: string) => ({
      code: key,
      // name: locales[key],
      file: `./${key}.json`,// 'loader.ts',
      // file: 'loader.ts',
      language: key
    })),
    langDir: 'locales',
    lazy: true,
    strategy: 'no_prefix',
    skipSettingLocaleOnNavigate: true,
    defaultLocale: 'en',
    // vueI18n: './i18n.config.ts',
    compilation: {
      // allow HTML in locales
      strictMessage: false
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