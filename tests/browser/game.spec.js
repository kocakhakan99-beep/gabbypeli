import { test, expect } from "@playwright/test";

for (const width of [360, 768]) {
  test(`game navigation and new activities at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.locator("#gf-sound").click();
    await expect(page.locator("#gf-open-sizes")).toBeVisible();
    await page.locator("#gf-open-sizes").click();
    for (const answer of ["Suuri", "Pieni", "Suuri", "Pieni"]) {
      await page
        .locator("#gf-choices")
        .getByRole("button", { name: answer, exact: true })
        .click();
      await page.locator("#gf-action").click();
    }
    await expect(page.locator("#gf-win")).toBeVisible();
    await page.locator("#gf-other").click();
    await page.locator("#gf-open-memory").click();
    await page.locator("#gf-action").click();
    await page.locator("#gf-cards button").first().click();
    await page.locator("#gf-hint").click();
    await expect(page.locator("#gf-cards .faceup")).toHaveCount(4);
    await page.locator("#gf-action").click();
    await expect(page.locator("#gf-cards .faceup")).toHaveCount(0);
    await page.locator("#gf-home-button").click();
    await page.locator("#gf-open-puzzle").click();
    await page.locator("#gf-hint").click();
    await expect(page.locator("#gf-board .cue")).toHaveCount(1);
    await page.locator("#gf-board .cue").click();
    await expect(page.locator("#gf-board .filled")).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("sound effects run and mute suspends audio", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator("#gf-open-sizes").click();
  await page
    .locator("#gf-choices")
    .getByRole("button", { name: "Suuri", exact: true })
    .click();
  const audio = await page.evaluate(async () => {
    const { state } = await import("/app/state.js");
    return { available: Boolean(state.ctx), status: state.ctx?.state };
  });
  expect(audio.available).toBe(true);
  await page.locator("#gf-sound").click();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { state } = await import("/app/state.js");
        return state.ctx.state;
      }),
    )
    .toBe("suspended");
  expect(errors).toEqual([]);
});
