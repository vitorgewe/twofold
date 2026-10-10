import { test, expect } from '@playwright/test';

// The core flow from docs/spec.md, and nothing else. Written during planning and
// approved by the human. Build sessions may not edit this file.
const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:8081';

test.use({ viewport: { width: 390, height: 844 } });

test('core flow', async ({ page }) => {
  await page.goto(BASE_URL);
  // Replace with the steps of the core flow, asserting on what the user sees.
  await expect(page.locator('body')).not.toBeEmpty();
});
