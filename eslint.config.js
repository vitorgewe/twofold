const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expo,
  {
    // The ledger rules are pure (constitution, ADR-0005): no UI, Expo, database layer or app routes.
    files: ['src/features/ledger/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react/*', 'react-native', 'react-native/*', 'react-native-*', 'expo', 'expo-*', 'expo/*'], message: 'The ledger must not depend on React, React Native or Expo.' },
            { group: ['**/data', '**/data/*', '@/data', '@/data/*'], message: 'The ledger must not import the database layer.' },
            { group: ['**/app', '**/app/*', '@/app', '@/app/*', '**/ui', '**/ui/*', '@/ui', '@/ui/*'], message: 'The ledger must not import screens or UI.' },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist/*', 'e2e/*', 'playwright.config.ts'],
  },
]);
