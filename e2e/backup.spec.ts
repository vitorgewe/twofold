import { readFileSync } from 'node:fs';

import { test, expect, type Browser, type Page } from '@playwright/test';

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:8081';

test.use({ viewport: { width: 390, height: 844 }, locale: 'en-US' });

async function createAccount(page: Page, name: string, type: 'Asset' | 'Expense') {
  await page.getByRole('button', { name: 'New account' }).click();
  await page.getByLabel('Account name').fill(name);
  await page.getByRole('radio', { name: type }).click();
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

async function fillPosting(page: Page, n: number, account: string, side: 'Debit' | 'Credit', amount: string) {
  const posting = page.getByTestId(`posting-${n}`);
  await posting.getByLabel('Account').click();
  await page.getByRole('option', { name: account }).click();
  await posting.getByRole('radio', { name: side }).click();
  await posting.getByLabel('Amount').fill(amount);
}

async function seed(page: Page) {
  const id = Date.now().toString(36);
  await page.goto(`${BASE_URL}/accounts`);
  await createAccount(page, `Wallet ${id}`, 'Asset');
  await createAccount(page, `Food ${id}`, 'Expense');
  await page.goto(`${BASE_URL}/transactions/new`);
  await page.getByLabel('Description').fill(`Lunch ${id}`);
  await fillPosting(page, 1, `Wallet ${id}`, 'Credit', '100.00');
  await fillPosting(page, 2, `Food ${id}`, 'Debit', '100.00');
  await page.getByRole('button', { name: 'Save transaction' }).click();
  await expect(page.getByRole('heading', { name: 'Twofold' })).toBeVisible();
}

async function exportBackup(page: Page, path: string) {
  await page.goto(`${BASE_URL}/settings`);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^twofold-backup-\d{4}-\d{2}-\d{2}\.json$/);
  await file.saveAs(path);
  await expect(page.getByTestId('backup-message')).toContainText('Backup ready');
}

async function pickFile(page: Page, path: string) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import backup' }).click();
  await (await chooser).setFiles(path);
}

async function freshPage(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
  return context.newPage();
}

async function summary(page: Page) {
  await page.goto(`${BASE_URL}/`);
  const netWorth = (await page.getByTestId('net-worth').textContent()) ?? '';
  await page.goto(`${BASE_URL}/transactions`);
  await page.getByRole('heading', { name: 'Transactions' }).waitFor();
  // Wait for the list to settle: either rows or the empty state.
  await expect(page.getByRole('link', { name: /^Open transaction / }).first().or(page.getByText('No transactions yet'))).toBeVisible();
  return { netWorth, count: await page.getByRole('link', { name: /^Open transaction / }).count() };
}

test('a backup restores net worth and transactions in a fresh browser profile', async ({ page, browser }, info) => {
  await seed(page);
  const before = await summary(page);
  expect(before.count).toBeGreaterThan(0);
  const path = info.outputPath('backup.json');
  await exportBackup(page, path);

  await page.goto(`${BASE_URL}/`);
  await expect(page.getByTestId('backup-status')).toHaveText('Last backup today');

  const fresh = await freshPage(browser);
  expect((await summary(fresh)).count).toBe(0);
  await fresh.goto(`${BASE_URL}/settings`);
  await pickFile(fresh, path);
  await expect(fresh.getByTestId('import-preview')).toContainText('Transactions: ' + before.count);
  await expect(fresh.getByTestId('import-preview')).toContainText('replaces all current data');
  await fresh.getByRole('button', { name: 'Replace my data' }).click();
  await expect(fresh.getByTestId('backup-message')).toHaveText('Backup imported.');

  await fresh.reload();
  expect(await summary(fresh)).toEqual(before);
  await fresh.context().close();
});

test('a tampered or unknown-version file is rejected and data stays', async ({ page }, info) => {
  await seed(page);
  const path = info.outputPath('backup.json');
  await exportBackup(page, path);
  const backup = JSON.parse(readFileSync(path, 'utf8'));
  const before = await summary(page);

  const tampered = structuredClone(backup);
  tampered.postings[0].amount += 1;
  tampered.postings[0].amount_brl += 1;
  const tamperedPath = info.outputPath('tampered.json');
  await (await import('node:fs')).promises.writeFile(tamperedPath, JSON.stringify(tampered));
  await page.goto(`${BASE_URL}/settings`);
  await pickFile(page, tamperedPath);
  await expect(page.getByTestId('backup-errors')).toContainText('does not balance');
  await expect(page.getByTestId('import-preview')).toHaveCount(0);

  const unknownPath = info.outputPath('unknown.json');
  await (await import('node:fs')).promises.writeFile(unknownPath, JSON.stringify({ ...backup, format_version: 99 }));
  await pickFile(page, unknownPath);
  await expect(page.getByTestId('backup-errors')).toContainText('format_version');

  expect(await summary(page)).toEqual(before);
});

test('settings shows the app version', async ({ page }) => {
  await page.goto(`${BASE_URL}/settings`);
  await expect(page.getByTestId('app-version')).toHaveText(/^Version \d+\.\d+\.\d+/);
});
