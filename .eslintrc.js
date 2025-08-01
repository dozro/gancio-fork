module.exports = {
  "extends": [
    "@nuxt" // The same as @nuxt/eslint-config
  ],
  root: true,
  env: {
    browser: true,
    node: true,
    'jest/globals': true
  },  
  plugins: [
    'prettier',
    'jest'
  ],
  rules: {
    'vue/v-slot-style': 'off',
    "vue/valid-v-slot": ["error", {
      "allowModifiers": false
    }],
  // add your custom rules here
    'nuxt/no-cjs-in-config': 'off',
    camelcase: 'off',
    'no-console': 'off',
    'arrow-parens': 'off',
    'import/order': 'off',
    'space-in-parens': 'off',
    'eol-last': 'off'
  }
}
