import { defineConfig, devices } from '@playwright/test';

// No webServer: .relay/init.sh starts the dev server.
export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:8081',
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
