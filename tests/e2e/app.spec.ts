import { test, expect } from '@playwright/test';

test('can select an athlete and inspect details', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'BJJ Universe', exact: true }),
  ).toBeVisible();

  await page.getByTestId('athlete-list-item-athlete_7507').click();

  await expect(page.getByTestId('athlete-detail-panel')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Nicholas Meregali' }),
  ).toBeVisible();
  await expect(page.getByText(/Won over Henrique Cardoso/i)).toBeVisible();
});
