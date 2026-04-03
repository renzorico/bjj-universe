import { test, expect } from '@playwright/test';

test('can enter the universe route and inspect an athlete', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'BJJ Universe', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: /Open the universe/i }).click();
  await expect(page).toHaveURL(/\/universe$/);
  await expect(
    page.getByRole('heading', { name: 'Real ADCC graph explorer' }),
  ).toBeVisible();
  await expect(
    page.locator('[aria-label="Interactive athlete graph"]'),
  ).toBeVisible();
  await expect(
    page.locator('[aria-label="Interactive athlete graph"] canvas').first(),
  ).toBeVisible();

  await page
    .getByRole('searchbox', { name: 'Search athletes' })
    .fill('Meregali');
  await page.getByTestId('athlete-list-item-athlete_7507').click();

  await expect(page.getByTestId('athlete-detail-panel')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Nicholas Meregali' }),
  ).toBeVisible();
  await expect(page.getByText(/Won over Henrique Cardoso/i)).toBeVisible();
});
