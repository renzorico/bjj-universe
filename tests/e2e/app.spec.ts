import { test, expect } from '@playwright/test';

test('can use design mode explorer layout and inspect an athlete from search', async ({
  page,
}) => {
  await page.goto('/universe');

  await expect(
    page.getByRole('heading', { name: 'Node graph explorer' }),
  ).toBeVisible();
  await expect(page.getByText('Real ADCC graph exploration')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollHeight <= window.innerHeight + 1,
      ),
    )
    .toBe(true);
  await expect(
    page.locator('[aria-label="Interactive athlete graph"]'),
  ).toBeVisible();
  await expect(page.getByTestId('design-mode-stage')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const graphApi = (
          window as Window & {
            __BJJ_UNIVERSE_GRAPH__?: {
              ready: boolean;
            };
          }
        ).__BJJ_UNIVERSE_GRAPH__;

        return graphApi?.ready ?? false;
      }),
    )
    .toBe(true);

  await page.getByRole('searchbox', { name: /search athletes/i }).click();
  await page.getByRole('searchbox', { name: /search athletes/i }).fill('mereg');
  await page.getByRole('button', { name: /nicholas meregali/i }).click();

  await expect(page.getByTestId('athlete-detail-panel')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Nicholas Meregali' }),
  ).toBeVisible();
  await expect(page.getByText(/Won over Henrique Cardoso/i)).toBeVisible();
});
