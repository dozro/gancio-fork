import { version } from './package.json'
import locales from './i18n/locales/index'

const isBuild = process.env.NODE_ENV === 'production'

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
    'vuetify/styles',
    '~/assets/css/main.css',
    '@mdi/font/css/materialdesignicons.css'
  ],
  modules: ['@nuxt/eslint', 'nuxt-auth-utils', '@nuxtjs/i18n', '@nuxtjs/sitemap'],
  sitemap: {
    cacheMaxAgeSeconds: 3600, // 1 hour

    sources: [
      '/api/sitemap/events',
      '/api/sitemap/tags',
      '/api/sitemap/places'
    ],

    // Optional defaults
    defaults: {
      changefreq: 'weekly',
      priority: 0.7
    }
  },
  i18n: {
    defaultLocale: 'en',
    langDir: 'locales/',   // must be set, but won’t be used for actual loading
    types: 'composition',
    pages: undefined,
    locales: Object.keys(locales).map(key => ({
      code: key,
      name: locales[key],
      file: 'en.js'
    })),
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
  build: {
    transpile: ['vuetify']
  },
  vite: {
    optimizeDeps: {
      include: ['lodash/debounce', 'luxon', 'linkifyjs', 'mitt', 'v-calendar', '@vue/devtools-core',
        '@vue/devtools-kit', '@tiptap/vue-3', '@tiptap/starter-kit', '@vueuse/core', '@vue-leaflet/vue-leaflet'],
    },
    server: {
      watch: {
        usePolling: false
      },
    },
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
      locale_storage: {
        driver: 'fs',
        base: isBuild ? './nuxt/server/i18n/locales' : './i18n/locales'
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
