/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    // Convention du projet : en-tête seul, sans corps de message
    'body-empty': [1, 'always'],
  },
}
