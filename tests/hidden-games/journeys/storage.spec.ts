import { test, expect, type Page } from "@playwright/test";

// J10: with the campaign's storage key blocked, a find still registers in memory
// (the site stays playable) and the technical copy appears once.

const pit = (page: Page) => page.locator("canvas").first();

test("J10 storage blocked shows the technical copy; the site stays playable", async ({ page }) => {
  // Block only the campaign key so the rest of the app's storage is unaffected.
  await page.addInitScript(() => {
    const proto = window.Storage.prototype;
    const realSet = proto.setItem;
    proto.setItem = function (key: string, value: string) {
      if (String(key).startsWith("pedigree_hidden_games:")) throw new Error("blocked");
      return realSet.call(this, key, value);
    };
  });

  await page.goto("/");
  await pit(page).dispatchEvent("pointerdown"); // G01 awards in memory; the write is refused

  await expect(
    page.getByText(
      "Your browser is blocking game progress. You can still play, but the games you find cannot be saved on this device."
    )
  ).toBeVisible();
  // Still playable: the counter reflects the in-memory find.
  await expect(page.getByText(/1\/2 games found/)).toBeVisible();
});
