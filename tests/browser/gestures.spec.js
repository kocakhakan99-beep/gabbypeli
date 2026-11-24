import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 360, height: 740 },
  hasTouch: true,
  isMobile: true,
});

async function swipe(page, points) {
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [points[0]],
  });
  for (const point of points.slice(1)) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [point],
    });
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await session.detach();
}

test("one swipe opens multiple flowers and the next bed also works by keyboard", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#gf-sound").click();
  await page.locator("#gf-open-garden").click();
  await expect(page.locator("#gf-play")).toHaveAttribute("data-input", "phaser");
  const field = page.locator("#gf-garden-field");
  for (const count of [3, 4]) {
    for (const stage of ["soil", "water", "tidy"]) {
      await expect(field).toHaveAttribute("data-stage", stage);
      for (let index = 0; index < count; index++) {
        const flower = field.locator("button").nth(index);
        for (let n = 0; n < 4; n++) await flower.press("Enter");
      }
    }
    await page.locator("#gf-action").click();
  }
  await expect(page.locator("#gf-win")).toBeVisible();
});

test("a puzzle piece follows a finger and lands in its matching slot", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#gf-sound").click();
  await page.locator("#gf-open-puzzle").click();
  await expect(page.locator("#gf-play")).toHaveAttribute("data-input", "phaser");
  const piece = page.locator('#gf-tray [data-piece="0"]');
  await piece.scrollIntoViewIfNeeded();
  const a = await piece.boundingBox();
  const slot = page.locator('#gf-board [data-piece="0"]');
  const b = await slot.boundingBox();
  const from = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
  const to = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  await swipe(page, [
    from,
    { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 },
    to,
  ]);
  await expect(slot).toHaveClass(/filled/);
  await expect(page.locator(".puzzle-ghost")).toHaveCount(0);
});

test("a finger circles the bowl, drags paper onto the tray and opens the oven", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#gf-open-baking").click();
  await expect(page.locator("#gf-play")).toHaveAttribute("data-input", "phaser");
  await page.getByRole("button", { name: "Piparit" }).click();
  await expect(page.locator(".baking-wash")).toHaveClass(/phaser-preparation-ready/);
  await page.getByRole("button", { name: "Avaa hana" }).click();
  await page.getByRole("button", { name: "Ota saippuaa" }).click();
  await page.getByRole("button", { name: "Pese kädet" }).click();
  await page.getByRole("button", { name: "Huuhtele kädet" }).click();
  await page.getByRole("button", { name: "Kuivaa kädet" }).click();
  for (const name of ["Lisää jauhot", "Lisää muna", "Lisää maito"])
    await page.getByRole("button", { name }).press("Enter");
  const bowl = page.locator(".bakery-bowl.mixing");
  await expect(bowl).toHaveClass(/phaser-mixing-ready/);
  await expect(bowl.locator("canvas")).toBeVisible();
  await bowl.scrollIntoViewIfNeeded();
  const { x, y, width, height } = await bowl.boundingBox();
  const circle = Array.from({ length: 21 }, (_, i) => ({
    x: x + width / 2 + (Math.cos((i * Math.PI) / 8) * width) / 3,
    y: y + height / 2 + (Math.sin((i * Math.PI) / 8) * height) / 3,
  }));
  await swipe(page, circle);
  expect(
    Number(await page.locator(".bakery-progress").getAttribute("value")),
  ).toBeGreaterThan(0);
  await swipe(page, circle);
  const roller = page.getByRole("button", { name: "Kauli taikina" });
  await roller.scrollIntoViewIfNeeded();
  await swipe(page, [
    await center(roller),
    await center(page.locator(".bakery-work-target")),
  ]);
  for (let index = 0; index < 6; index++)
    await page.getByRole("button", { name: "Paina kissamuottia" }).press("Enter");
  const paper = page.getByRole("button", {
    name: "Aseta leivinpaperi pellille",
  });
  await expect(page.locator(".bakery-bowl.mixing canvas")).toHaveCount(0);
  await expect(page.locator(".bakery-tray")).toHaveClass(/phaser-tray-ready/);
  await paper.scrollIntoViewIfNeeded();
  async function center(locator) {
    const box = await locator.boundingBox();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }
  await swipe(page, [
    await center(paper),
    await center(page.locator(".bakery-tray")),
  ]);
  await expect(page.locator(".bakery-slot")).toHaveCount(6);
  for (const portion of await page.locator(".bakery-dough > div").all())
    await portion.press("Enter");
  const door = page.getByRole("button", { name: "Avaa uunin luukku" });
  await door.scrollIntoViewIfNeeded();
  const handle = await center(door);
  await swipe(page, [handle, { x: handle.x, y: handle.y + 55 }]);
  await expect(
    page.getByRole("button", { name: "Siirrä pelti uuniin" }),
  ).toBeVisible();
});

