module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  env: {
    browser: true,
  },
  extends: ['standard'],
  plugins: [
    'svelte3',
    '@typescript-eslint',
  ],
  rules: {
    semi: ['error', 'always'],
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'comma-dangle': ['error', 'always-multiline'],
    'space-before-function-paren': ['error', {
      named: 'never',
      anonymous: 'always',
      asyncArrow: 'always',
    }],
    'no-multiple-empty-lines': ['error', {
      max: 1,
      maxBOF: 2,
      maxEOF: 1,
    }],
  },
  overrides: [{
    files: ['*.svelte'],
    processor: 'svelte3/svelte3',
    rules: {
      'import/first': 'off',
    },
  }],
  settings: {
    'svelte3/ignore-styles': () => true,
    'svelte3/typescript': () => require('typescript'),
  },
};

