import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
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
