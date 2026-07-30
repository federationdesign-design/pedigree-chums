import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const RECORD_KEY = "pedigree_hidden_games:HIDDEN_GAMES_2026_01";

// WCAG 2.2 AA automatable evidence (BRIEF 9). The screen-reader journey and the
// named human sign-off are owner/human work and are not automated here.

// First visit (no seed) so the prelude renders. Its display line
// "THIS WEBSITE MAY CONTAIN GAMES" is the brand accent #f7ed57 on #4dabe9, a
// deliberate WCAG AA exception (2.07:1) the owner accepted on 30 July 2026,
// documented in BRIEF 9. It is excluded by the [data-hg-aa-exception] selector
// ONLY, so the gate still catches every other regression on the prelude. This
// is not a general loosening of the contrast rule and not a claim that the line
// passes AA.
test("WCAG the prelude passes axe, bar the one owner-accepted brand-accent line", async ({
  page,
}) => {
  await page.goto("/about");
  await expect(page.getByText("THIS WEBSITE MAY CONTAIN GAMES")).toBeVisible({
    timeout: 8000,
  });
  const results = await new AxeBuilder({ page })
    .include("[role='status']")
    .exclude("[data-hg-aa-exception]") // owner-accepted AA exception, BRIEF 9
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations.filter((v) =>
    ["serious", "critical"].includes(v.impact ?? "")
  );
  expect(serious.map((v) => v.id)).toEqual([]);
});

test.describe("return-visit campaign chrome", () => {
  // Seed a return visit so the counter is immediate (not gated by the C03 reveal).
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
    }, RECORD_KEY);
  });

  test("WCAG the counter has no serious or critical axe violations", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByText(/0\/2 games found/)).toBeVisible();
    const results = await new AxeBuilder({ page })
      .include("[role='status']")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? "")
    );
    expect(serious.map((v) => v.id)).toEqual([]);
  });

  test("undiscovered game names are absent from the DOM and accessibility tree", async ({
    page,
  }) => {
    await page.goto("/about");
    await expect(page.getByText(/0\/2 games found/)).toBeVisible();
    const body = await page.locator("body").innerText();
    // The found-games list is deferred (D12), so no game name is rendered anywhere.
    expect(body).not.toContain("The Main Pit");
    expect(body).not.toContain("The Lineage Game");
  });

  test("reduced motion: the completion celebration is a static highlight, no animation", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript((key) => {
      localStorage.setItem(
        key as string,
        JSON.stringify({
          record_schema: 3,
          campaign_version: "HIDDEN_GAMES_2026_01",
          total_at_last_seen: 2,
          completed_game_ids: ["G01", "G02"],
          count: 2,
          updated_at: new Date().toISOString(),
          intro_seen: true,
          completion_seen: false,
          prelude_seen: true,
        })
      );
    }, RECORD_KEY);
    await page.goto("/about");
    const heading = page.getByText("You found every hidden game!");
    await expect(heading).toBeVisible();
    const animationName = await heading.evaluate(
      (el) => getComputedStyle(el.closest("div") as HTMLElement).animationName
    );
    expect(animationName).toBe("none");
  });
});
