module.exports = {
  "extends": [
    "@nuxt" // The same as @nuxt/eslint-config
  ],
  rules: {
    'vue/v-slot-style': 'off',
    "vue/valid-v-slot": ["error", {
      "allowModifiers": false
    }],
  }
}
