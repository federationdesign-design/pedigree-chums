import { test, expect, type Page } from "@playwright/test";

// BRIEF 11.2 journeys against the C01 G01 threshold: G01 awards on the first
// deliberate pointer interaction with the Main Pit (a pointerdown on the pit
// canvas), never on navigation. Each test starts with empty localStorage.

// The Main Pit renders a Matter canvas; it is the first canvas on the home page.
const pit = (page: Page) => page.locator("canvas").first();

// These journeys test finds, not the C03 timed reveal, so seed a return visit
// (prelude_seen) to show the counter immediately.
test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    if (localStorage.getItem(key as string)) return; // keep progress across reload/nav
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
  }, "pedigree_hidden_games:HIDDEN_GAMES_2026_01");
});

test("J02 arrive on the home page, touch the pit, see 1/2", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/0\/2 games found/)).toBeVisible();
  await pit(page).dispatchEvent("pointerdown");
  await expect(page.getByText(/1\/2 games found/)).toBeVisible();
});

test("navigating to the home route without touching the pit never awards G01", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByText(/0\/2 games found/)).toBeVisible();
  // Arrive on the home route (the pit is present) but never touch it.
  await page.goto("/");
  await expect(page.getByText(/0\/2 games found/)).toBeVisible();
  // Under the C01 threshold, being on the pit page without a pointer never awards.
  await expect(page.getByText(/1\/2 games found/)).toHaveCount(0);
});

test("J08 a second pit touch and a refresh never double-count", async ({ page }) => {
  await page.goto("/");
  await pit(page).dispatchEvent("pointerdown");
  await expect(page.getByText(/1\/2 games found/)).toBeVisible();
  await pit(page).dispatchEvent("pointerdown"); // replay: dedup keeps it at 1/2
  await expect(page.getByText(/1\/2 games found/)).toBeVisible();
  await page.reload(); // progress persists on the same browser
  await expect(page.getByText(/1\/2 games found/)).toBeVisible();
});
