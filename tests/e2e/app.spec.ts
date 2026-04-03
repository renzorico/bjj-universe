import { test, expect } from '@playwright/test';

test('can click a graph node and inspect an athlete', async ({ page }) => {
  await page.goto('/universe');

  await expect(
    page.getByRole('heading', { name: 'Real ADCC graph explorer' }),
  ).toBeVisible();
  await expect(
    page.locator('[aria-label="Interactive athlete graph"]'),
  ).toBeVisible();
  await expect(
    page.locator('[aria-label="Interactive athlete graph"] canvas').first(),
  ).toBeVisible();

  const graphPoint = await page.evaluate(() => {
    const graphApi = (
      window as Window & {
        __BJJ_UNIVERSE_GRAPH__?: {
          getNodeScreenPosition: (
            nodeId: string,
          ) => { x: number; y: number } | null;
        };
      }
    ).__BJJ_UNIVERSE_GRAPH__;

    return graphApi?.getNodeScreenPosition('athlete_7507') ?? null;
  });

  expect(graphPoint !== null).toBe(true);
  if (!graphPoint) {
    throw new Error('Expected a graph screen position for athlete_7507.');
  }

  await page.mouse.click(graphPoint.x, graphPoint.y);

  await expect(page.getByTestId('athlete-detail-panel')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Nicholas Meregali' }),
  ).toBeVisible();
  await expect(page.getByText(/Won over Henrique Cardoso/i)).toBeVisible();
});
