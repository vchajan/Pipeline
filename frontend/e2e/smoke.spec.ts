import { expect, test } from "@playwright/test";

test("smoke test loads app", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Pipeline Monitor/i);
});