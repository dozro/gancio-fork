import { defineConfig } from 'vitepress'
import vuetify from 'vite-plugin-vuetify'
import imageFigures from 'markdown-it-image-figures'

// fix dead link errors on build
process.env.VITE_EXTRA_EXTENSIONS = 'asc' // comma separated list: 'foo,bar,baz'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/v2',
  vite: {
    plugins: [vuetify()],
    ssr: {
      noExternal: ['vuetify']
    }
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag: string) => tag.startsWith('gancio-')
      }
    }
  },
  title: 'Gancio',
  description: 'A shared agenda for local communities',
  markdown: {
    config: (md) => {
      md.use(imageFigures, { figcaption: true })
    }
  },
  themeConfig: {
    logo: {
      light: '/assets/gancio-dark.png',
      dark: '/assets/gancio-light.png',
      alt: 'Gancio'
    },
    lastUpdated: {
      formatOptions: {
        dateStyle: 'long'
      }
    },
    editLink: {
      text: 'Edit this page',
      pattern: 'https://framagit.org/les/gancio/-/edit/main/docs/:path'
    },
    search: {
      provider: 'local'
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Instances', link: '/instances' },
      { text: 'Changelog', link: '/changelog' },
      { text: 'Blog', link: '/blog/', activeMatch: '/blog' }
    ],

    sidebar: [
      { text: 'Screenshot', link: '/screenshot' },
      // { text: 'FAQ', link: '/faq' },
      {
        text: 'USAGE',
        link: '/usage/',
        collapsed: false,
        items: [
          { text: 'Home', link: '/usage/home' },
          { text: 'Add Event', link: '/usage/add_event' },
          { text: 'Share', link: '/usage/share' },
          { text: 'Settings', link: '/usage/settings' },
          // { text: 'Recurrent', link: '/usage/recurrent' },
          { text: 'Embed events in webpages', link: '/usage/embed' },
          { text: 'Moderation', link: '/usage/moderation' },
          { text: 'Pages', link: '/usage/pages' },
          { text: 'Users', link: '/usage/users' },
          { text: 'Federation', link: '/usage/federation' },
          { text: 'Plugins', link: '/usage/plugins' },
          { text: 'Custom CSS', link: '/usage/custom_css' },
          { text: 'Custom JS', link: '/usage/custom_js' },
          { text: 'CLI', link: '/usage/cli' }
        ]
      },
      {
        text: 'INSTALL', link: '/install/', collapsed: false,
        items: [
          { text: 'Debian', link: '/install/debian' },
          { text: 'Docker', link: '/install/docker' },
          { text: 'Nixos', link: '/install/nixos' },
          { text: 'Backup', link: '/install/backup' },
          { text: 'Configuration', link: '/install/configuration' },
          { text: 'Nominatim', link: '/install/nominatim' },
          { text: 'Nginx', link: '/install/nginx' }
        ]
      },
      {
        text: 'Hacking', link: '/dev/',
        items: [
          { text: 'Code', link: '/dev/code' },
          { text: 'Internationalization', link: '/dev/locales' },
          { text: 'Plugins', link: '/dev/plugin' },
          { text: 'API', link: '/dev/api' },
          { text: 'Federation', link: '/dev/federation' }
        ]
      },
      { text: 'About', link: '/about' },
      { text: 'Contacts', link: '/contact' },
      { text: 'Contribute', link: '/contribute' },
      { text: 'Instances', link: '/instances' }
    ],

    socialLinks: [
      { icon: 'git', link: 'https://framagit.org/les/gancio' },
      { icon: 'activitypub', link: 'https://mastodon.cisti.org/@gancio' }
    ]
  }
})
