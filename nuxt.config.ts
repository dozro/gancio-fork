import { defineNuxtConfig } from 'nuxt/config'
import { version } from './package.json'
import locales from './server/i18n/locales'
import vitePluginVuetify from 'vite-plugin-vuetify'

const isBuild = process.env.NODE_ENV === 'production'
const isTest = process.env.VITEST == 'true'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer: {
    host: '0.0.0.0',
    port: 13120
  },
  experimental: {
    serverAppConfig: false
  },
  compatibilityDate: '2025-07-20',
  // 2025-07-20

  devtools: {
    enabled: true,
    timeline: {
      enabled: false
    }
  },
  sourcemap: {
    server: !isBuild,
    client: !isBuild
  },
  css: [
    'vuetify/styles',
    '~/assets/css/main.css',
    '@mdi/font/css/materialdesignicons.css'
  ],
  modules: ['@nuxt/eslint', 'nuxt-auth-utils', '@nuxtjs/i18n', (!isTest && '@nuxtjs/sitemap'), '@nuxt/hints'],
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
    lazy: !isTest,
    langDir: !isTest ? 'locales/' : undefined, // must be set, but won’t be used for actual loading
    types: 'composition',
    pages: undefined,
    locales: isTest
      ? []
      : Object.keys(locales).map(key => ({
          code: key,
          name: locales[key],
          dir: ['ar', 'fa', 'ta'].includes(key) ? 'rtl' : 'ltr',
          file: 'loader.ts'
        })),
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
        secure: isBuild // process.env.NODE_ENV === 'production',
      }
    },
    public: {
      version
    }
  },
  build: {
    transpile: ['vuetify', '@vue-leaflet/vue-leaflet']
  },
  vite: {
    esbuild: {
      sourcemap: !isBuild
    },
    optimizeDeps: {
      include: ['lodash/debounce', 'luxon', 'linkifyjs', 'mitt', 'v-calendar', '@vue/devtools-core',
        '@vue/devtools-kit', '@tiptap/vue-3', '@tiptap/starter-kit', '@vueuse/core', '@vue-leaflet/vue-leaflet']
    },
    server: {
      allowedHosts: ['localhost', '127.0.0.1', 'test.cisti.org'],
      watch: {
        usePolling: false
      }
    },
    clearScreen: false,
    define: {
      'process.env.DEBUG': false
    },
    build: {
      sourcemap: !isBuild,
      target: 'esnext'
    },
    plugins: [
      vitePluginVuetify()
    ]
  },
  nitro: {
    preset: 'node-server',
    compressPublicAssets: true,
    imports: {
      autoImport: false
    },
    esbuild: {
      options: {
        target: 'esnext',
        tsconfigRaw: {
          // See https://github.com/nuxt/nuxt/issues/14126
          //     https://github.com/unjs/nitro/issues/273
          compilerOptions: {
            experimentalDecorators: true
          }
        }
      }
    }
  }
})
