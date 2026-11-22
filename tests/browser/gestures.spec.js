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

test("one finger draws a continuous line, undo clears it, and completion earns a sticker", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#gf-sound").click();
  await page.locator("#gf-open-drawing").click();
  const paper = page.locator("#gf-drawing-paper");
  await paper.scrollIntoViewIfNeeded();
  const box = await paper.boundingBox();
  const { x, y } = { x: box.x + 28, y: box.y + 35 };
  await swipe(page, [
    { x, y },
    { x: x + 50, y },
    { x: x + 100, y },
  ]);
  const ink = () =>
    paper.evaluate((canvas) => {
      const pixels = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let painted = 0;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) painted++;
      return painted;
    });
  expect(await ink()).toBeGreaterThan(1000);
  await page.locator("#gf-drawing-undo").click();
  expect(await ink()).toBe(0);
  await paper.scrollIntoViewIfNeeded();
  const again = await paper.boundingBox();
  await swipe(page, [
    { x: again.x + 28, y: again.y + 35 },
    { x: again.x + 100, y: again.y + 35 },
  ]);
  await page.locator("#gf-action").click();
  await expect(page.locator("#gf-win")).toBeVisible();
  await page.locator("#gf-other").click();
  await expect(page.locator("#gf-stickers .earned")).toHaveText("Taiteilija");
});

test("one swipe opens multiple flowers and the next bed also works by keyboard", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#gf-sound").click();
  await page.locator("#gf-open-garden").click();
  const field = page.locator("#gf-garden-field");
  await field.scrollIntoViewIfNeeded();
  const buds = field.locator("button");
  const points = [];
  for (const bud of await buds.all()) {
    const { x, y, width, height } = await bud.boundingBox();
    points.push({ x: x + width / 2, y: y + height / 2 });
  }
  await swipe(page, points);
  await expect(field.locator(".bloomed")).toHaveCount(3);
  await page.locator("#gf-action").click();
  for (const bud of await buds.all()) await bud.press("Enter");
  await expect(field.locator(".bloomed")).toHaveCount(4);
  await page.locator("#gf-action").click();
  await expect(page.locator("#gf-win")).toBeVisible();
});

test("a puzzle piece follows a finger and lands in its matching slot", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#gf-sound").click();
  await page.locator("#gf-open-puzzle").click();
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

test("a finger mixes the batter and paints frosting across two cupcakes", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#gf-sound").click();
  await page.locator("#gf-open-baking").click();
  const bowl = page.locator("#gf-baking-add");
  await bowl.scrollIntoViewIfNeeded();
  const box = await bowl.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await swipe(page, [
    { x: x - 22, y },
    { x, y: y - 24 },
    { x: x + 22, y },
  ]);
  await expect(page.locator("#gf-baking-count")).toHaveText("1");
  await bowl.click();
  await page.locator("#gf-baking-check").click();
  await page.locator("#gf-baking-bake").click();
  await page.getByRole("button", { name: "Mustikka" }).click();
  const plate = page.locator("#gf-baking-plate");
  await plate.scrollIntoViewIfNeeded();
  const points = [];
  for (const cake of await plate.locator("button").all()) {
    const spot = await cake.boundingBox();
    points.push({ x: spot.x + spot.width / 2, y: spot.y + spot.height / 2 });
  }
  await swipe(page, points);
  await expect(plate.locator("[data-topping=violet]")).toHaveCount(2);
  await page.getByRole("button", { name: "Tarjoile Hileelle" }).click();
  await expect(page.locator("#gf-action")).toHaveText("Seuraava resepti");
});

test("a swipe leaves a row of colored paw stamps that can be undone", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#gf-sound").click();
  await page.locator("#gf-open-drawing").click();
  await page.locator("#gf-drawing-stamp").click();
  const paper = page.locator("#gf-drawing-paper");
  await paper.scrollIntoViewIfNeeded();
  const { x, y } = await paper.boundingBox();
  await swipe(page, [
    { x: x + 30, y: y + 45 },
    { x: x + 145, y: y + 45 },
  ]);
  const ink = () =>
    paper.evaluate((canvas) => {
      const pixels = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;
      return pixels.reduce(
        (total, channel, index) =>
          total + (index % 4 === 3 && channel > 0 ? 1 : 0),
        0,
      );
    });
  expect(await ink()).toBeGreaterThan(4000);
  await page.locator("#gf-drawing-undo").click();
  await expect.poll(ink).toBe(0);
});
