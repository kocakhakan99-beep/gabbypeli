import { test, expect } from "@playwright/test";

test("real recorded instructions play and stop when muted", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      window.lastGameAudio = this;
      return original.apply(this, args);
    };
  });
  await page.goto("/");
  await expect(page.locator("#gf-voice-status")).toContainText(
    "Gabbyn puheäänitteet",
  );
  await page.locator("#gf-open-memory").click();
  await expect
    .poll(() => page.evaluate(() => window.lastGameAudio?.readyState ?? 0))
    .toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => window.lastGameAudio.src)).toMatch(
    /assets\/audio\/.*\.mp3$/,
  );
  await expect
    .poll(() => page.evaluate(() => window.lastGameAudio.paused))
    .toBe(false);
  await page.locator("#gf-sound").click();
  expect(await page.evaluate(() => window.lastGameAudio.paused)).toBe(true);
});

test("baking dialogue matches the first recipe and every clip is served", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.locator("#gf-sound").click();
  await page.locator("#gf-open-baking").click();
  await expect(page.locator("#gf-baking-target")).toHaveText("2");
  await expect(page.locator("#gf-baking-dialogue")).toBeVisible();
  const manifest = await (
    await request.get("/assets/audio/manifest.json")
  ).json();
  for (const filename of new Set(Object.values(manifest))) {
    const response = await request.get("/assets/audio/" + filename);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("audio");
  }
});
