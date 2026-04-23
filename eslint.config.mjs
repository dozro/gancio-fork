import withNuxt from './.nuxt/eslint.config.mjs'
import vuetify from 'eslint-plugin-vuetify'
import { globalIgnores } from 'eslint/config'
import stylistic from '@stylistic/eslint-plugin'

export default withNuxt([
  globalIgnores([
    'wp-plugin/js/',
    'server/migrations/',
    'docs/',
    'tests/'
  ]),
  stylistic.configs.recommended,
  ...vuetify.configs['flat/base'],
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      'no-undef': 'error',
      'vue/no-undef-properties': ['error'],
      // do not enforce v-slot style
      'vue/v-slot-style': 'off',
      'vue/html-indent': ['error', 2, {
        attribute: 1,
        baseIndent: 0,
        closeBracket: 0,
        alignAttributesVertically: false,
        ignores: []
      }],
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/brace-style': 'off',
      '@stylistic/space-before-function-paren': 'off',
      '@stylistic/eol-last': 'off',
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/operator-linebreak': 'off',
    }
  }

])
