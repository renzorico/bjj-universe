import { test, expect } from '@playwright/test';

test('can select an athlete and inspect details', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'BJJ Universe', exact: true }),
  ).toBeVisible();

  await page.getByTestId('athlete-list-item-athlete_kade-ruotolo').click();

  await expect(page.getByTestId('athlete-detail-panel')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Kade Ruotolo' }),
  ).toBeVisible();
  await expect(page.getByText(/Won over JT Torres/i)).toBeVisible();
});
