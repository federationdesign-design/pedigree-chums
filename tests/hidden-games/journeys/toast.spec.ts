import { test, expect } from "@playwright/test";

// C02: the discovery toast must appear ABOVE the full-screen mini pit modal at
// the moment of the G02 find, or the confirmation is invisible. Fresh visitor,
// so G02 is a non-final find (remaining 1) and fires the toast (the final find
// would show the completion card instead).

test("the discovery toast appears above the mini pit modal at the moment of the G02 find", async ({
  page,
}) => {
  await page.goto("/britains-dog-history");
  await page.getByRole("button", { name: /View .* family tree/ }).first().click();
  await page.getByRole("button", { name: "Play" }).first().click({ force: true });

  const toast = page.getByText("Nice one! You found a hidden game. 1 more to find.");
  await expect(toast).toBeVisible();

  // It renders above the mini pit modal (z-index 900).
  const zIndex = await toast.evaluate((el) =>
    parseInt(
      getComputedStyle((el.closest("[role='status']") as HTMLElement) ?? el).zIndex || "0",
      10
    )
  );
  expect(zIndex).toBeGreaterThan(900);
});
