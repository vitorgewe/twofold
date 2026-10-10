import { test, expect, type Page } from '@playwright/test';

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

test('a saved transaction updates the balances, also after a reload', async ({ page }) => {
  const id = Date.now().toString(36);
  const wallet = `Wallet ${id}`;
  const food = `Food ${id}`;

  await page.goto(`${BASE_URL}/accounts`);
  await createAccount(page, wallet, 'Asset');
  await createAccount(page, food, 'Expense');

  await page.goto(`${BASE_URL}/transactions/new`);
  await page.getByLabel('Description').fill('  Lunch  ');
  await fillPosting(page, 1, wallet, 'Credit', '42.50');
  await fillPosting(page, 2, food, 'Debit', '42.50');

  const save = page.getByRole('button', { name: 'Save transaction' });
  await expect(save).toBeEnabled();
  // A double tap in the same instant must still create exactly one transaction.
  await save.dblclick();

  await expect(page.getByRole('heading', { name: 'Twofold' })).toBeVisible();

  const balances = async () => {
    await page.goto(`${BASE_URL}/accounts`);
    await expect(page.getByText(wallet, { exact: true })).toBeVisible();
    const row = (name: string) => page.getByText(name, { exact: true }).locator('xpath=ancestor::div[.//*[contains(text(), "42")]][1]');
    await expect(row(wallet)).toContainText(/42[.,]50/);
    await expect(row(food)).toContainText(/42[.,]50/);
  };
  await balances();
  await page.reload();
  await balances();

  // One transaction only: the statement of the wallet has a single row.
  await page.getByRole('link', { name: `Open statement of ${wallet}` }).click();
  await expect(page.getByText('Lunch', { exact: true })).toHaveCount(1);
});
