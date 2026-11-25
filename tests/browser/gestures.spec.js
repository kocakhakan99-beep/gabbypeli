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
  await page.getByRole("button", { name: "Kukkapenkit", exact: true }).click();
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
}, testInfo) => {
  await page.goto("/");
  await page.locator("#gf-open-baking").click();
  await expect(page.locator("#gf-play")).toHaveAttribute("data-input", "phaser");
  await page.getByRole("button", { name: "Piparit" }).click();
  await expect(page.locator(".wash-counter")).toBeVisible();
  async function moveWash(name, offsets) {
    const object = page.getByRole("button", { name, exact: true });
    await object.scrollIntoViewIfNeeded();
    const box = await object.boundingBox();
    const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    expect(await object.evaluate((element, point) => element.contains(document.elementFromPoint(point.x, point.y)), start)).toBe(true);
    await swipe(page, [start, ...offsets.map(([x, y]) => ({ x: start.x + x, y: start.y + y }))]);
  }
  await page.getByRole("button", { name: "Avaa hana", exact: true }).tap();
  await expect(page.getByRole("button", { name: "Ota saippuaa" })).toBeDisabled();
  await moveWash("Avaa hana", [[24, 0]]);
  const valve = page.locator(".wash-tap");
  await expect(valve.locator(".wash-base")).toHaveCSS("rotate", "none");
  await expect(valve.locator(".wash-head")).toHaveCSS("rotate", "17deg");
  await expect(page.locator(".wash-stream")).toHaveCSS("animation-name", "bakery-water-flow");
  await moveWash("Ota saippuaa", [[0, 20]]);
  await moveWash("Pese kädet", [[30, 0], [-30, 0], [30, 0]]);
  await moveWash("Huuhtele kädet", [[24, 0]]);
  await expect(page.locator(".wash-state")).toHaveAttribute("data-frame", "hands-rinse");
  const towel = page.getByRole("button", { name: "Kuivaa kädet" });
  await towel.scrollIntoViewIfNeeded();
  await page.locator(".baking-wash").screenshot({ path: testInfo.outputPath("wash-station.png") });
  const basin = page.locator(".wash-hands");
  const handPoint = await center(basin);
  const startTowel = await center(towel);
  await swipe(page, [startTowel, handPoint, { x: handPoint.x - 10, y: handPoint.y }, startTowel]);
  await expect(page.locator(".wash-dry .bakery-texture")).toHaveAttribute("data-frame", "wash-towel-wet");
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
  await swipe(page, [...circle].reverse());
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


test("a side swipe turns an individual memory card", async ({ page }) => {
  await page.goto("/");
  await page.locator("#gf-open-memory").click();
  await expect(page.locator("#gf-play")).toHaveAttribute("data-input", "phaser");
  await page.locator("#gf-cards button").first().press("Enter");
  const card = page.locator("#gf-cards .memory-card").first();
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await swipe(page, [start, { x: start.x + 34, y: start.y }]);
  await expect(card).toHaveAttribute("aria-pressed", "true");
});

test("dragging the room door opens the next hide-and-seek room", async ({ page }) => {
  await page.goto("/");
  await page.locator("#gf-open-find").tap();
  await expect(page.locator("#gf-play")).toHaveAttribute("data-input", "phaser");
  for (const spot of await page.locator(".hide-spot").all()) {
    await spot.press("Enter");
    if (await page.locator(".find-next-door").isVisible()) break;
  }
  const door = page.locator(".find-next-door");
  await door.scrollIntoViewIfNeeded();
  const box = await door.boundingBox();
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await door.tap();
  await expect(page.locator(".hide-room")).toHaveAttribute("data-room", "gabby");
  await swipe(page, [start, { x: start.x + 40, y: start.y }]);
  await expect(page.locator(".hide-room")).toHaveAttribute("data-room", "cakey");
});

test("dragging the artwork into its frame reveals the same drawing", async ({ page }) => {
  await page.goto("/");
  await page.locator("#gf-open-drawing").tap();
  await page.locator("#gf-drawing-paper").tap();
  const sheet = page.locator("#gf-drawing-sheet");
  await sheet.scrollIntoViewIfNeeded();
  const source = await sheet.boundingBox();
  const target = await page.locator("#gf-drawing-frame").boundingBox();
  await swipe(page, [
    { x: source.x + source.width / 2, y: source.y + source.height / 2 },
    { x: target.x + target.width / 2, y: target.y + target.height / 2 },
  ]);
  const result = page.getByRole("img", { name: "Oma piirustus" });
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute("src", /^data:image\/png;base64,/);
});
