import { test, expect } from "@playwright/test";

test("room illustrations load across the panel and motion runs in the bubbles and garden", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#gf-open-bubbles").click();
  const panel = page.locator(".game-panel");
  await expect(panel).toHaveCSS("background-image", /room-bathroom\.webp/);
  const asset = await page.request.get("/assets/room-bathroom.webp");
  expect(asset.ok()).toBeTruthy();
  await expect(
    page.locator("#gf-bubble-field .bubble-shape").first(),
  ).toHaveCSS("animation-name", "bubble-float");
  await expect(page.locator("#gf-bubble-target .bubble-shape")).toHaveCSS(
    "animation-name",
    "target-pulse",
  );
  await page.locator("#gf-home-button").click();
  await page.locator("#gf-open-garden").click();
  await expect(panel).toHaveCSS("background-image", /room-garden\.webp/);
  await expect(page.locator(".garden-bud").first()).toHaveCSS(
    "animation-name",
    "bud-sway",
  );
  await page.locator("#gf-home-button").click();
  await page.locator("#gf-open-baking").click();
  await expect(panel).toHaveCSS("background-image", /room-kitchen\.webp/);
});

test("reduced motion turns off decorative animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#gf-open-bubbles").click();
  await expect(
    page.locator("#gf-bubble-field .bubble-shape").first(),
  ).toHaveCSS("animation-name", "none");
});
