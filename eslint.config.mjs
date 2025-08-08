// ESLint flat config
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore build output and config files
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'eslint.config.mjs',
      'prettier.config.cjs',
      'vitest.config.ts',
      'jest.config.cjs',
    ],
  },

  // Base JS rules
  js.configs.recommended,

  // TypeScript recommended (type-aware)
  ...tseslint.configs.recommendedTypeChecked,

  // Prettier: turn off formatting-related rules in ESLint
  eslintConfigPrettier,

  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parserOptions: {
        // Let TypeScript ESLint discover tsconfig automatically
        projectService: true,
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
      },
    },
    rules: {
      // Example sensible defaults
      'no-console': 'warn',
      'no-unused-vars': 'off', // handled by TS
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['test/**/*.ts', 'test/**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {},
  },
);
