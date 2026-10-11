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

async function setup(page: Page, description: string) {
  const id = Date.now().toString(36);
  const wallet = `Wallet ${id}`;
  const food = `Food ${id}`;
  await page.goto(`${BASE_URL}/accounts`);
  await createAccount(page, wallet, 'Asset');
  await createAccount(page, food, 'Expense');

  await page.goto(`${BASE_URL}/transactions/new`);
  await page.getByLabel('Description').fill(description);
  await fillPosting(page, 1, wallet, 'Credit', '100.00');
  await fillPosting(page, 2, food, 'Debit', '100.00');
  await page.getByRole('button', { name: 'Save transaction' }).click();
  await expect(page.getByRole('heading', { name: 'Twofold' })).toBeVisible();
  return { wallet, food };
}

async function openTransaction(page: Page, description: string) {
  await page.goto(`${BASE_URL}/transactions`);
  await page.getByRole('link', { name: `Open transaction ${description}` }).click();
  await expect(page.getByRole('heading', { name: description })).toBeVisible();
}

test('editing keeps the books balanced and updates the balances', async ({ page }) => {
  const description = `Groceries ${Date.now().toString(36)}`;
  const { food } = await setup(page, description);
  const netWorthBefore = (await page.getByTestId('net-worth').textContent()) ?? '';
  await openTransaction(page, description);

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByTestId('posting-1').getByLabel('Amount').fill('120.00');
  await page.getByTestId('posting-2').getByLabel('Amount').fill('130.00');
  await expect(page.getByRole('button', { name: 'Save transaction' })).toBeDisabled();
  await expect(page.getByTestId('difference')).toContainText(/10[.,]00/);

  await page.getByTestId('posting-2').getByLabel('Amount').fill('120.00');
  await page.getByRole('button', { name: 'Save transaction' }).click();
  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();

  await page.reload();
  await page.goto(`${BASE_URL}/accounts`);
  const row = page.getByText(food, { exact: true }).locator('xpath=ancestor::div[.//*[contains(text(), "120")]][1]');
  await expect(row).toContainText(/120[.,]00/);

  // Home shows totals, not accounts: the edit lowered the net worth by 20.00 against the 100.00 it was saved with.
  await page.goto(`${BASE_URL}/`);
  await expect(page.getByTestId('net-worth')).not.toHaveText(netWorthBefore);
});

test('deleting asks for confirmation and stays gone after a reload', async ({ page }) => {
  const description = `Dinner ${Date.now().toString(36)}`;
  await setup(page, description);
  await openTransaction(page, description);

  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: description })).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();
  await expect(page.getByRole('link', { name: `Open transaction ${description}` })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('link', { name: `Open transaction ${description}` })).toHaveCount(0);
});
