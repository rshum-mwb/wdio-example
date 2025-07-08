import js from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,

  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        console: 'readonly',
        browser: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    rules: {
      semi: ['warn', 'always'],
      'prettier/prettier': 'error',
    },
  },

  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
