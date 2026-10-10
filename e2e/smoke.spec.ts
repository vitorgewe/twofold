import { test, expect } from '@playwright/test';

// The core flow from docs/spec.md, and nothing else. Written during planning and
// approved by the human. Build sessions may not edit this file. The names it uses
// are listed in the smoke test contract in docs/plan/plan.md.
const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:8081';

test.use({ viewport: { width: 390, height: 844 }, locale: 'en-US' });

test('core flow', async ({ page }) => {
  // A fresh browser context starts with an empty database. Create two accounts.
  await page.goto(`${BASE_URL}/accounts`);
  const accounts = [
    { name: 'Checking', type: 'Asset' },
    { name: 'Groceries', type: 'Expense' },
  ];
  for (const account of accounts) {
    await page.getByRole('button', { name: 'New account' }).click();
    await page.getByLabel('Account name').fill(account.name);
    await page.getByRole('radio', { name: account.type }).click();
    await page.getByRole('button', { name: 'Save account' }).click();
    await expect(page.getByText(account.name, { exact: true })).toBeVisible();
  }

  // 1. Open the app and see net worth in BRL.
  await page.goto(BASE_URL);
  await expect(page.getByTestId('net-worth')).toContainText('0.00');

  // 2. Record a transaction: one credit on Checking, one debit on Groceries.
  await page.getByRole('button', { name: 'New transaction' }).click();
  await page.getByLabel('Description').fill('Weekly groceries');
  const postings = [
    { row: 'posting-1', account: 'Checking', side: 'Credit', amount: '100.00' },
    { row: 'posting-2', account: 'Groceries', side: 'Debit', amount: '90.00' },
  ];
  for (const posting of postings) {
    const row = page.getByTestId(posting.row);
    await row.getByLabel('Account').click();
    await page.getByRole('option', { name: posting.account }).click();
    await row.getByRole('radio', { name: posting.side }).click();
    await row.getByLabel('Amount').fill(posting.amount);
  }

  // 3. It saves only when debits equal credits.
  const save = page.getByRole('button', { name: 'Save transaction' });
  await expect(save).toBeDisabled();
  await page.getByTestId('posting-2').getByLabel('Amount').fill('100.00');
  await expect(save).toBeEnabled();
  await save.click();

  // 4. Home shows the updated net worth and month result.
  await expect(page.getByTestId('net-worth')).toHaveText(/-\s?R\$\s?100\.00/);
  await expect(page.getByTestId('month-result')).toHaveText(/-\s?R\$\s?100\.00/);

  // The ledger survives a reload.
  await page.reload();
  await expect(page.getByTestId('net-worth')).toHaveText(/-\s?R\$\s?100\.00/);
});
