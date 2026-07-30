import { test, expect, type Page } from "@playwright/test";

// J03: complete both finds and see the achievement copy, with no prize, code or
// entry wording (ACHIEVEMENT_ONLY). G01 is a Main Pit pointer (home route); G02
// is starting the mini pit on the history page.

const pit = (page: Page) => page.locator("canvas").first();

// Seed a return visit so the counter is immediate (this tests completion, not
// the C03 timed reveal).
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

test("J03 complete both finds: achievement copy, no prize/code/entry wording", async ({ page }) => {
  // G01: touch the Main Pit on the home route.
  await page.goto("/");
  await pit(page).dispatchEvent("pointerdown");
  await expect(page.getByText(/1\/2 games found/)).toBeVisible();

  // G02: open a family tree on the history page and start the mini pit.
  await page.goto("/britains-dog-history");
  await page.getByRole("button", { name: /View .* family tree/ }).first().click();
  await page.getByRole("button", { name: "Play" }).first().click({ force: true });

  // Completion: the two approved section 7 lines.
  const heading = page.getByText("You found every hidden game!");
  await expect(heading).toBeVisible();
  await expect(
    page.getByText("You completed the first Pedigree Chums Hidden Games challenge.")
  ).toBeVisible();

  // No prize/code/draw/winner/entry wording in the completion UI (scoped to the
  // completion card so unrelated page text, e.g. a nav "discount code" link,
  // does not false-positive).
  const card = page.locator("[role='status']", { hasText: "You found every hidden game" });
  const text = (await card.innerText()).toLowerCase();
  for (const banned of ["prize", "code", "draw", "winner", "entry", "enter to"]) {
    expect(text, `completion copy must not contain "${banned}"`).not.toContain(banned);
  }
});
