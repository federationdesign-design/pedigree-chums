import { test, expect } from "@playwright/test";

// C03 timed reveal, from page load, first visit only:
//   0-5s nothing / 5-8s prelude / 8-12s introduction / >12s plain counter.
// Return visit: no cards, counter immediately.
// Driven on /about (a calm page with no Main Pit) so the campaign chrome is
// observed without incidental finds.

const RECORD_KEY = "pedigree_hidden_games:HIDDEN_GAMES_2026_01";

test("first visit: nothing at 5s, then prelude, then introduction, then the counter", async ({
  page,
}) => {
  test.setTimeout(45000);
  await page.goto("/about");

  // 0-5s: nothing renders.
  await page.waitForTimeout(3000);
  await expect(page.getByText("THIS WEBSITE MAY CONTAIN GAMES")).toHaveCount(0);
  await expect(page.getByText(/games found/)).toHaveCount(0);

  // 5-8s: the prelude card.
  await expect(page.getByText("THIS WEBSITE MAY CONTAIN GAMES")).toBeVisible({
    timeout: 6000,
  });
  await expect(page.getByText("Warning:")).toBeVisible();

  // 8-12s: the introduction card.
  await expect(
    page.getByText(/hidden games across the Pedigree Chums website/)
  ).toBeVisible({ timeout: 6000 });

  // >12s: the plain counter.
  await expect(page.getByText(/0\/2 games found/)).toBeVisible({ timeout: 6000 });
});

test("return visit: no cards, the counter appears immediately", async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(
      key as string,
      JSON.stringify({
        record_schema: 3,
        campaign_version: "HIDDEN_GAMES_2026_01",
        total_at_last_seen: 2,
        completed_game_ids: [],
        count: 0,
        updated_at: new Date().toISOString(),
        intro_seen: true,
        completion_seen: false,
        prelude_seen: true,
      })
    );
  }, RECORD_KEY);
  await page.goto("/about");
  await expect(page.getByText(/0\/2 games found/)).toBeVisible();
  await expect(page.getByText("THIS WEBSITE MAY CONTAIN GAMES")).toHaveCount(0);
});
