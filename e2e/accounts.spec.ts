import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:8081';

test.use({ viewport: { width: 390, height: 844 }, locale: 'en-US' });

test('a created account survives a reload', async ({ page }) => {
  await page.goto(`${BASE_URL}/accounts`);
  await page.getByRole('button', { name: 'New account' }).click();
  await page.getByLabel('Account name').fill('Checking');
  await page.getByRole('radio', { name: 'Asset' }).click();
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect(page.getByText('Checking', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText('Checking', { exact: true })).toBeVisible();
});
