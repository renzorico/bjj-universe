import { test, expect } from '@playwright/test';

test('homepage smoke test', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'BJJ Universe' }),
  ).toBeVisible();
  await expect(
    page.getByText('A living grappling atlas, not a dashboard'),
  ).toBeVisible();
});
