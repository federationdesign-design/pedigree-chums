import { test, expect } from "@playwright/test";

const RECORD_KEY = "pedigree_hidden_games:HIDDEN_GAMES_2026_01";

// Performance evidence (BRIEF 9). The full pass/fail gate is the Lighthouse
// mobile preset (4x CPU, simulated slow 4G) run against a production build,
// recorded in BRIEF 9.4; that plus two real-device spot checks are owner work.
// These are the campaign-scoped assertions Playwright can make directly.

test("no 0/2 flash before restored progress for a returning visitor", async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(
      key as string,
      JSON.stringify({
        record_schema: 3,
        campaign_version: "HIDDEN_GAMES_2026_01",
        total_at_last_seen: 2,
        completed_game_ids: ["G01"],
        count: 1,
        updated_at: new Date().toISOString(),
        intro_seen: true,
        completion_seen: false,
      })
    );
  }, RECORD_KEY);
  await page.goto("/about");
  await expect(page.getByText(/1\/2 games found/)).toBeVisible();
  // Restore-before-render: 0/2 is never painted for a returning 1/2 visitor.
  await expect(page.getByText(/0\/2 games found/)).toHaveCount(0);
});

test("the counter is position:fixed, so it contributes no layout shift", async ({ page }) => {
  await page.goto("/about");
  const label = page.getByText(/0\/2 games found/);
  await expect(label).toBeVisible();
  const position = await label.evaluate(
    (el) => getComputedStyle((el.closest("[role='status']") as HTMLElement) ?? el).position
  );
  expect(position).toBe("fixed");
});
