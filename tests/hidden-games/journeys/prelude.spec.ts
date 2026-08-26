import { test, expect } from "@playwright/test";

// The prelude and introduction cards are switched OFF behind the CARDS_ENABLED
// flag in components/HiddenGamesCounter/HiddenGamesCounter.tsx. These journeys
// now assert the hidden behaviour: walking far enough into the site that, with
// the flag on, each card would be due, and confirming neither ever appears.
// They replace the former "first visit: ... then prelude, then introduction"
// journey, which asserted the cards appearing. Driven on calm pages with no
// Main Pit so the campaign chrome is observed without incidental finds.

const RECORD_KEY = "pedigree_hidden_games:HIDDEN_GAMES_2026_01";

// Replaces the prelude half of the former first-visit reveal journey.
test("cards flag off: the prelude card never appears on its eligible page", async ({
  page,
}) => {
  test.setTimeout(45000);
  // Page 2 is the prelude's earliest eligible page, where (flag on) it would
  // show immediately on load. Walk there as a fresh visitor.
  await page.goto("/about"); // page 1
  await page.goto("/good-dog-bad-dog"); // page 2: prelude would fire at once
  await page.waitForTimeout(3000);
  await expect(page.getByText("THIS WEBSITE MAY CONTAIN GAMES")).toHaveCount(0);
  await expect(page.getByText("Warning:")).toHaveCount(0);
});

// Replaces the introduction half of the former first-visit reveal journey.
test("cards flag off: the introduction card never appears on its eligible page", async ({
  page,
}) => {
  test.setTimeout(45000);
  // Page 3 is the introduction's earliest eligible page, where (flag on) it
  // would show 10s after load. Walk there and wait past that window.
  await page.goto("/about"); // page 1
  await page.goto("/good-dog-bad-dog"); // page 2
  await page.goto("/britains-dog-history"); // page 3: introduction would fire at 10s
  await page.waitForTimeout(12000);
  await expect(
    page.getByText(/There are hidden games across the website/)
  ).toHaveCount(0);
  await expect(page.getByText("Find them all")).toHaveCount(0);
  // The prelude never appears here either.
  await expect(page.getByText("THIS WEBSITE MAY CONTAIN GAMES")).toHaveCount(0);
});

// Formerly "return visit: no cards, the counter appears immediately". The old
// counter-visibility assertion depended on the logo being present on this page
// and is unrelated to the cards, so it is dropped; what remains asserts the
// hidden behaviour: a returning visitor (seen-flags seeded) still sees neither
// card, exactly as a fresh one does now that the flag is off.
test("cards flag off: a return visit shows neither the prelude nor the introduction", async ({ page }) => {
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
  await page.waitForTimeout(3000);
  await expect(page.getByText("THIS WEBSITE MAY CONTAIN GAMES")).toHaveCount(0);
  await expect(page.getByText("Warning:")).toHaveCount(0);
  await expect(page.getByText(/There are hidden games across the website/)).toHaveCount(0);
});
