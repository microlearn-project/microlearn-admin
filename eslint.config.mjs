// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/no-multiple-template-root': 'off',
    'vue/max-attributes-per-line': ['error', { singleline: 3 }],
    // Désactiver les règles problématiques
    'quotes': 'off',
    'no-trailing-spaces': 'off',        
    'semi': 'off'
    "ignoreEOLComments": true
  }
})
