import { test, expect } from '@playwright/test';

test('can click a 3d graph node and inspect an athlete', async ({ page }) => {
  await page.goto('/universe');

  await expect(
    page.getByRole('heading', { name: 'Node graph explorer' }),
  ).toBeVisible();
  await expect(page.getByText('Real ADCC graph exploration')).toBeVisible();
  await expect(
    page.locator('[aria-label="Interactive athlete graph"]'),
  ).toBeVisible();
  await expect(
    page.locator('[aria-label="Interactive athlete graph"] canvas').first(),
  ).toBeVisible();
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

  const graphPoint = await page.evaluate(() => {
    const graphApi = (
      window as Window & {
        __BJJ_UNIVERSE_GRAPH__?: {
          selectNode: (nodeId: string | null) => void;
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

  await page.evaluate(() => {
    const graphApi = (
      window as Window & {
        __BJJ_UNIVERSE_GRAPH__?: {
          selectNode: (nodeId: string | null) => void;
        };
      }
    ).__BJJ_UNIVERSE_GRAPH__;

    graphApi?.selectNode('athlete_7507');
  });

  await expect(page.getByTestId('athlete-detail-panel')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Nicholas Meregali' }),
  ).toBeVisible();
  await expect(page.getByText(/Won over Henrique Cardoso/i)).toBeVisible();
});
