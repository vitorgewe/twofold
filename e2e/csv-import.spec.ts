import { promises as fs } from 'node:fs';

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:8081';

test.use({ viewport: { width: 390, height: 844 }, locale: 'en-US' });

async function pickCsv(page: Page, path: string) {
  await page.goto(`${BASE_URL}/settings`);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import CSV' }).click();
  await (await chooser).setFiles(path);
}

async function netWorth(page: Page) {
  await page.goto(`${BASE_URL}/`);
  await expect(page.getByTestId('net-worth')).toBeVisible();
  return (await page.getByTestId('net-worth').textContent()) ?? '';
}

test('the spec example imports once and a second import adds nothing', async ({ page }) => {
  await pickCsv(page, 'e2e/fixtures/example.csv');
  const preview = page.getByTestId('csv-preview');
  await expect(preview).toContainText('Accounts to create: 3');
  await expect(preview).toContainText('New transactions: 2');
  await expect(preview).toContainText('Already imported (skipped): 0');
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByTestId('backup-message')).toHaveText('Imported 2 transactions.');

  await page.reload();
  const after = await netWorth(page);
  // A fresh browser context starts empty: Checking -2,050.00 plus Crypto +1,750.00.
  expect(after).toBe('-R$300.00');

  await pickCsv(page, 'e2e/fixtures/example.csv');
  await expect(page.getByTestId('csv-preview')).toContainText('New transactions: 0');
  await expect(page.getByTestId('csv-preview')).toContainText('Already imported (skipped): 2');
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByTestId('backup-message')).toHaveText('Nothing new to import.');
  expect(await netWorth(page)).toBe(after);
});

test('a broken file is rejected with line numbers and nothing is written', async ({ page }, info) => {
  const base = (await fs.readFile('e2e/fixtures/example.csv', 'utf8')).trimEnd().split('\n');
  const broken = info.outputPath('broken.csv');
  // t-0002 loses its Checking row, the BTC row loses its rate, and an amount has too many decimals.
  await fs.writeFile(
    broken,
    [base[0], base[1], base[2].replace('300.00', '300.001'), 't-0002,2026-09-06,Buy BTC,Crypto,asset,debit,0.00500000,BTC,'].join('\n'),
  );
  const before = await netWorth(page);
  await pickCsv(page, broken);
  const errors = page.getByTestId('csv-errors');
  await expect(errors).toContainText('Line 3:');
  await expect(errors).toContainText('more than 2 fraction digits');
  await expect(errors).toContainText('Line 4: rate_to_brl is required for BTC rows.');
  await expect(page.getByRole('button', { name: 'Import', exact: true })).toBeDisabled();
  expect(await netWorth(page)).toBe(before);

  const missingRow = info.outputPath('missing-row.csv');
  await fs.writeFile(missingRow, base.slice(0, 4).join('\n'));
  await pickCsv(page, missingRow);
  await expect(page.getByTestId('csv-errors')).toContainText('transaction t-0002');
  await expect(page.getByTestId('csv-errors')).toContainText('Line 4');
  await expect(page.getByRole('button', { name: 'Import', exact: true })).toBeDisabled();
});

test('a description with a comma in quotes is imported intact', async ({ page }) => {
  await pickCsv(page, 'e2e/fixtures/split.csv');
  await expect(page.getByTestId('csv-preview')).toContainText('Postings to write: 4');
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByTestId('backup-message')).toHaveText('Imported 1 transaction.');
  await page.goto(`${BASE_URL}/transactions`);
  await expect(page.getByText('Dinner, drinks and tip').first()).toBeVisible();
});
