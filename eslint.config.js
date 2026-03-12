// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: [
      'constants/theme.ts',
      'constants/DesignTokens.ts',
      'constants/DesignSystem.ts',
      '**/*.test.*',
      '**/__tests__/**',
      'coverage/**',
    ],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: "Literal[value=/^#[0-9A-Fa-f]{3,8}$/]",
          message: 'Use design tokens from constants/theme.ts instead of raw hex colors.',
        },
      ],
    },
  },
]);
