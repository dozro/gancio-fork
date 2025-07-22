import withNuxt from '.nuxt/eslint.config.mjs'
import vue from 'eslint-plugin-vue'
import vuetify from 'eslint-plugin-vuetify'


export default withNuxt(
  ...vue.configs['flat/base'],
  ...vuetify.configs['flat/base'],
  // your custom flat configs go here, for example:
  {
  //   files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'vue/v-slot-style': 'off',
      "vue/valid-v-slot": ["error", {
        "allowModifiers": true
      }],
      'vue/attributes-order': 'off',
      'vue/no-v-text-v-html-on-component': 'off'
      // 'no-console': 'off' // allow console.log in TypeScript files
    }
  },
  // {
  //   ...
  // }
)
