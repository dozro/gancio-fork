// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import vuetify from 'eslint-plugin-vuetify'

export default withNuxt([
  ...vuetify.configs['flat/base'],
  {
    rules: {
      'vue/v-slot-style': 'off',
      "vue/valid-v-slot": ["error", {
        "allowModifiers": true
      }],
      'vue/attributes-order': 'off',
      'vue/no-v-text-v-html-on-component': 'off'
    }
  }
])
