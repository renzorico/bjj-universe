import { test, expect } from '@playwright/test';

test('shows 3D graph explorer and allows athlete selection from search', async ({
  page,
}) => {
  await page.goto('/universe');

  await expect(
    page.getByRole('heading', { name: 'Node graph explorer' }),
  ).toBeVisible();
  await expect(page.getByText('Real ADCC graph exploration')).toBeVisible();

  // Page must not scroll vertically
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollHeight <= window.innerHeight + 1,
      ),
    )
    .toBe(true);

  // 3D canvas container is present; design-mode SVG is gone
  await expect(
    page.locator('[aria-label="Interactive athlete graph"]'),
  ).toBeVisible();
  await expect(page.getByTestId('design-mode-stage')).not.toBeVisible();

  // Test API becomes ready once the canvas has mounted
  await expect
    .poll(() =>
      page.evaluate(() => {
        const graphApi = (
          window as Window & {
            __BJJ_UNIVERSE_GRAPH__?: { ready: boolean };
          }
        ).__BJJ_UNIVERSE_GRAPH__;
        return graphApi?.ready ?? false;
      }),
    )
    .toBe(true);

  // Athlete search flow
  await page.getByRole('searchbox', { name: /search athletes/i }).click();
  await page.getByRole('searchbox', { name: /search athletes/i }).fill('mereg');
  await page.getByRole('button', { name: /nicholas meregali/i }).click();

  await expect(page.getByTestId('athlete-detail-panel')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Nicholas Meregali' }),
  ).toBeVisible();
  await expect(page.getByText(/Won over Henrique Cardoso/i)).toBeVisible();
});
