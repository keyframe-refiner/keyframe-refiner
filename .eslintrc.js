const overrideRules = {
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
};

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
    browser: true,
  },
  parserOptions: {
    extraFileExtensions: ['.svelte'],
  },
  plugins: [
    'svelte3',
    '@typescript-eslint',
  ],
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
      extends: 'standard',
      rules: {
        ...overrideRules,
        'import/first': 'off',
      },
    },
    {
      files: ['*.ts'],
      extends: 'standard',
      rules: overrideRules,
    },
  ],
  settings: {
    'svelte3/ignore-styles': () => true,
    'svelte3/typescript': () => require('typescript'),
  },
};

