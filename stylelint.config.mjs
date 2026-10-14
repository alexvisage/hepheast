/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-recommended-vue'],
  ignoreFiles: ['dist/**', 'coverage/**'],
  rules: {
    // Convention BEM : bloc__element--modificateur
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      { message: 'Les classes suivent la convention BEM en kebab-case (bloc__element--modif)' },
    ],
    // Les couleurs passent par les design tokens définis dans src/styles/tokens.css
    'color-named': 'never',
    'declaration-no-important': true,
    'import-notation': 'string',
  },
  overrides: [
    {
      files: ['src/styles/tokens.css'],
      rules: { 'color-named': null },
    },
  ],
}
