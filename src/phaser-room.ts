import Phaser from "phaser";

function loadGabbyAtlas(scene: Phaser.Scene, key: string): void {
  const base = `./assets/gabby/atlases/${key}.webp`;
  scene.load.atlas(key, base, `${base}.json`);
}

export interface RoomItem {
  id: string;
  hidden: boolean;
  frame?: string;
}

export interface RoomView {
  reveal(index: number): void;
  drag(index: number, progress: number): void;
  destroy(): void;
}

/** Renders a hide-and-seek room. The HTML buttons provide accessible input. */
export function createRoomView(parent: HTMLElement, items: RoomItem[], friend: string, surprise: string): RoomView {
  const furniture: Phaser.GameObjects.Image[] = [];
  const surprises: Phaser.GameObjects.Image[] = [];
  const originalX: number[] = [];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let scene: Phaser.Scene | undefined;
  let ready = false;
  const pending = new Set<number>();

  function drag(index: number, progress: number): void {
    const object = furniture[index];
    if (!object) return;
    const amount = Phaser.Math.Clamp(progress, 0, 1);
    object.setX(originalX[index] - 105 * amount);
    object.setAngle(-10 * amount);
    object.setAlpha(1 - 0.75 * amount);
  }

  function reveal(index: number): void {
    if (!ready || !scene) {
      pending.add(index);
      return;
    }
    const object = furniture[index];
    const surprise = surprises[index];
    if (!object || !surprise) return;
    surprise.setVisible(true);
    if (reducedMotion) {
      drag(index, 1);
      return;
    }
    scene.tweens.add({ targets: object, x: originalX[index] - 105, angle: -10, alpha: 0.25, duration: 500, ease: "Sine.easeInOut" });
    const scaleX = surprise.scaleX;
    const scaleY = surprise.scaleY;
    surprise.setScale(scaleX * 0.2, scaleY * 0.2);
    scene.tweens.add({ targets: surprise, scaleX, scaleY, duration: 450, ease: "Back.easeOut" });
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    transparent: true,
    width: 800,
    height: 560,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: {
      preload() {
        if (items.some((item) => item.frame)) loadGabbyAtlas(this, "hide");
        for (const item of items) {
          if (!item.frame) this.load.image(item.id, `./assets/furniture/${item.id}.webp`);
        }
        this.load.image("hidden-friend", `./assets/friends/${friend}.webp`);
        this.load.image("hidden-surprise", `./assets/objects/${surprise}.webp`);
      },
      create() {
        if (items.some((item) => item.frame) && !this.textures.exists("hide")) return;
        scene = this;
        const positions = [[200, 140], [600, 140], [200, 420], [600, 420]];
        items.forEach((item, index) => {
          const [x, y] = positions[index];
          originalX.push(x);
          const surprise = this.add.image(x, y, item.hidden ? "hidden-friend" : "hidden-surprise");
          surprise.setDisplaySize(135, 135).setVisible(false);
          surprises.push(surprise);
          const image = this.add.image(x, y, item.frame ? "hide" : item.id, item.frame);
          const scale = Math.min(280 / image.width, 235 / image.height);
          image.setScale(scale);
          furniture.push(image);
        });
        ready = true;
        parent.parentElement?.classList.add("phaser-ready");
        pending.forEach(reveal);
        pending.clear();
      },
    },
  });
  return { reveal, drag, destroy: () => { parent.parentElement?.classList.remove("phaser-ready"); game.destroy(true); } };
}

export interface MixingView {
  move(x: number, y: number, progress: number): void;
  destroy(): void;
}

type BakingAtlas = { texture: string; data: string };

/** Draws the spoon and batter as the player stirs the mixing bowl. */
export function createMixingView(parent: HTMLElement, atlas: BakingAtlas): MixingView {
  let scene: Phaser.Scene | undefined;
  let spoon: Phaser.GameObjects.Image | undefined;
  let trails: Phaser.GameObjects.Graphics | undefined;
  let position = { x: 0.5, y: 0.5, progress: 0 };
  let alive = true;

  function move(x: number, y: number, progress: number): void {
    position = {
      x: Phaser.Math.Clamp(x, 0.15, 0.85),
      y: Phaser.Math.Clamp(y, 0.15, 0.85),
      progress: Phaser.Math.Clamp(progress, 0, 1),
    };
    if (!scene || !spoon || !trails) return;
    spoon.setPosition(position.x * 300, position.y * 300);
    spoon.setRotation(Math.atan2(position.y - 0.5, position.x - 0.5) - Math.PI / 2);
    trails.clear();
    trails.lineStyle(7, 0xfff3c9, 0.7);
    trails.beginPath();
    trails.arc(150, 150, 65, -Math.PI / 2, -Math.PI / 2 + position.progress * Math.PI * 2);
    trails.strokePath();
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    transparent: true,
    width: 300,
    height: 300,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: {
      preload() { this.load.atlas("baking", atlas.texture, atlas.data); },
      create() {
        if (!alive || !this.textures.get("baking").has("whisk")) return;
        scene = this;
        trails = this.add.graphics();
        spoon = this.add.image(150, 150, "baking", "whisk").setOrigin(0.5, 0.25);
        spoon.setScale(108 / spoon.height);
        parent.classList.add("phaser-mixing-ready");
        move(position.x, position.y, position.progress);
      },
    },
  });
  return {
    move,
    destroy() {
      alive = false;
      parent.classList.remove("phaser-mixing-ready");
      game.destroy(true);
    },
  };
}

export interface BakingTrayView {
  line(): void;
  place(index: number): void;
  destroy(): void;
}

/** Draws the parchment and individual portions on the baking tray. */
export function createBakingTrayView(parent: HTMLElement, atlas: BakingAtlas, portionFrame: string): BakingTrayView {
  let scene: Phaser.Scene | undefined;
  let paper: Phaser.GameObjects.Image | undefined;
  let alive = true;
  let lined = false;
  const placed = new Set<number>();
  const drawn = new Set<number>();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function line(): void {
    lined = true;
    if (!scene || !paper) return;
    paper.setVisible(true);
    if (!reducedMotion) {
      const x = paper.scaleX;
      const y = paper.scaleY;
      paper.setScale(x * 0.92, y * 0.92);
      scene.tweens.add({ targets: paper, scaleX: x, scaleY: y, duration: 250, ease: "Sine.easeOut" });
    }
  }

  function place(index: number): void {
    placed.add(index);
    if (!scene || drawn.has(index)) return;
    drawn.add(index);
    const x = 50 + (index % 3) * 100;
    const y = 27 + Math.floor(index / 3) * 54;
    const portion = scene.add.image(x, y, "baking", portionFrame);
    const scale = Math.min(43 / portion.width, 39 / portion.height);
    portion.setScale(scale);
    if (!reducedMotion) {
      portion.setScale(scale * 0.5);
      scene.tweens.add({ targets: portion, scale, duration: 300, ease: "Back.easeOut" });
    }
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    transparent: true,
    width: 300,
    height: 108,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: {
      preload() {
        this.load.atlas("baking", atlas.texture, atlas.data);
      },
      create() {
        if (!alive || !this.textures.get("baking").has("paper") || !this.textures.get("baking").has(portionFrame)) return;
        scene = this;
        paper = this.add.image(150, 54, "baking", "paper").setDisplaySize(290, 102).setVisible(false);
        parent.classList.add("phaser-tray-ready");
        if (lined) line();
        placed.forEach(place);
      },
    },
  });
  return {
    line,
    place,
    destroy() {
      alive = false;
      parent.classList.remove("phaser-tray-ready");
      game.destroy(true);
    },
  };
}

export function createGardenView(parent: HTMLElement, flowers: HTMLButtonElement[]): { destroy(): void } {
  let alive = true;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const plants: Array<{ soil: Phaser.GameObjects.Image; flower: Phaser.GameObjects.Image;
    weed: Phaser.GameObjects.Image; stone: Phaser.GameObjects.Image }> = [];
  const game = new Phaser.Game({
    type: Phaser.CANVAS, parent, transparent: true,
    width: parent.clientWidth, height: parent.clientHeight,
    scale: { mode: Phaser.Scale.RESIZE },
    scene: {
      preload() { loadGabbyAtlas(this, "garden"); },
      create() {
        if (!alive || !this.textures.exists("garden")) return;
        flowers.forEach(() => plants.push({
          soil: this.add.image(0, 0, "garden", "soil_dry"),
          flower: this.add.image(0, 0, "garden", "seedling").setOrigin(0.5, 1),
          weed: this.add.image(0, 0, "garden", "weed_clover"),
          stone: this.add.image(0, 0, "garden", "stone_small"),
        }));
        parent.classList.add("phaser-garden-ready");
      },
      update(time: number) {
        if (!alive) return;
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        plants.forEach(({ soil, flower, weed, stone }, index) => {
          const button = flowers[index];
          const x = parseFloat(button.style.getPropertyValue("--flower-x")) * width / 100;
          const y = parseFloat(button.style.getPropertyValue("--flower-y")) * height / 100 + 12;
          const growth = Number(button.style.getPropertyValue("--growth")) || 0;
          const dug = button.classList.contains("soil-done");
          const watered = button.classList.contains("water-done");
          const tidy = parent.dataset.stage === "tidy" && !button.classList.contains("tidy-done");
          soil.setFrame(watered ? "soil_wet" : dug ? "soil_loose" : "soil_dry").setPosition(x, y);
          soil.setScale(64 / soil.frame.realWidth);
          flower.setFrame(watered ? (index % 2 ? "flower_full" : "flower_bloom") : "seedling");
          flower.setVisible(dug).setPosition(x, y + 6);
          const size = watered ? 66 : parent.dataset.stage === "water" ? 26 + growth * 25 : 26;
          flower.setScale(size / flower.frame.realHeight);
          flower.setAngle(reducedMotion || !watered ? 0 : Math.sin(time / 700 + index) * 4);
          weed.setPosition(x - 20, y).setScale(24 / weed.frame.realWidth).setVisible(tidy).setAlpha(1 - growth);
          stone.setPosition(x + 22, y + 5).setScale(15 / stone.frame.realWidth).setVisible(tidy).setAlpha(1 - growth);
        });
      },
    },
  });
  return { destroy() {
    alive = false;
    parent.classList.remove("phaser-garden-ready");
    game.destroy(true);
  } };
}

export interface TileArt {
  id: string;
  folder: "friends" | "objects" | "gabby/images";
  frame?: string;
}

export interface TileView {
  activate(action: "flip" | "select" | "place", index: number): boolean;
  destroy(): void;
}

/** Keeps accessible HTML hit areas while Phaser handles tile events and animation. */
export function createTileView(parent: HTMLElement, mode: "memory" | "puzzle", art: TileArt[], rows = 1, onAction?: (action: "flip" | "select" | "place", index: number) => void): TileView {
  const overlay = document.createElement("div");
  overlay.className = "phaser-tile-layer";
  overlay.setAttribute("aria-hidden", "true");
  parent.append(overlay);
  let alive = true;
  let failed = false;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeScene: Phaser.Scene | undefined;
  const tiles = new Map<HTMLButtonElement, {
    image: Phaser.GameObjects.Image;
    backing?: Phaser.GameObjects.Image;
    up: boolean;
    openness: number;
  }>();
  const game = new Phaser.Game({
    type: Phaser.CANVAS, parent: overlay, transparent: true,
    width: parent.clientWidth, height: parent.clientHeight,
    scale: { mode: Phaser.Scale.RESIZE },
    scene: {
      preload() {
        this.load.on("loaderror", () => { failed = true; });
        if (mode === "memory") loadGabbyAtlas(this, "memory-puzzle");
        for (const item of new Map(art.map((item) => [item.id, item])).values()) {
          if (!item.frame) this.load.image(item.id, `./assets/${item.folder}/${item.id}.webp`);
        }
      },
      create() {
        if (!alive || failed) return;
        if (mode === "puzzle") {
          const texture = this.textures.get(art[0].id);
          const source = texture.getSourceImage() as HTMLImageElement;
          for (let index = 0; index < rows * 2; index++) {
            const column = index % 2;
            const row = Math.floor(index / 2);
            const left = Math.round(column * source.width / 2);
            const top = Math.round(row * source.height / rows);
            texture.add(String(index), 0, left, top,
              Math.round((column + 1) * source.width / 2) - left,
              Math.round((row + 1) * source.height / rows) - top);
          }
        }
        activeScene = this;
        if (onAction) this.events.on("tile-action", onAction);
        parent.classList.add(`phaser-${mode}-ready`);
      },
      update(this: Phaser.Scene) {
        if (!alive || failed) return;
        const bounds = parent.getBoundingClientRect();
        const buttons = [...parent.querySelectorAll<HTMLButtonElement>(mode === "memory" ? ".memory-card" : ".slot, .piece")];
        const current = new Set(buttons);
        tiles.forEach((tile, element) => {
          if (!current.has(element)) {
            tile.image.destroy();
            tile.backing?.destroy();
            tiles.delete(element);
          }
        });
        buttons.forEach((button) => {
          const index = Number(button.dataset[mode === "memory" ? "index" : "piece"]);
          const item = mode === "memory" ? art[index] : art[0];
          if (!item) return;
          const texture = item.frame ? "memory-puzzle" : item.id;
          if (!this.textures.exists(texture)) return;
          const rect = button.getBoundingClientRect();
          const up = mode === "memory" ? button.getAttribute("aria-pressed") === "true" && !button.classList.contains("closing") : !button.disabled || button.classList.contains("filled");
          let tile = tiles.get(button);
          if (!tile) {
            const backing = mode === "memory" ? this.add.image(0, 0, "memory-puzzle", "card_back_purple") : undefined;
            const image = this.add.image(0, 0, texture, mode === "puzzle" ? String(index) : item.frame);
            tile = { image, backing, up, openness: up ? 1 : 0 };
            tiles.set(button, tile);
          }
          const image = tile.image;
          const drag = Number(button.style.getPropertyValue("--card-drag"));
          const openness = !up && drag > 0 ? Math.max(tile.openness, drag * 0.48) : tile.openness;
          const visible = mode === "memory" ? openness > 0.5 : !button.classList.contains("piece") || !button.disabled;
          image.setVisible(visible);
          image.setPosition(rect.left - bounds.left + rect.width / 2, rect.top - bounds.top + rect.height / 2);
          if (mode === "memory") {
            const turn = Math.abs(Math.cos(openness * Math.PI));
            const backing = tile.backing!;
            backing.setFrame(visible ? "card_front" : "card_back_purple");
            backing.setPosition(image.x, image.y);
            const cardScale = Math.min(rect.width / backing.frame.realWidth, rect.height / backing.frame.realHeight);
            backing.setScale(cardScale * turn, cardScale);
            const faceScale = Math.min((rect.width * 0.8) / image.frame.realWidth,
              (rect.height * 0.8) / image.frame.realHeight);
            image.setScale(faceScale * turn, faceScale);
          } else {
            const scale = Math.min(Math.max(1, rect.width - 10) / image.frame.realWidth,
              Math.max(1, rect.height - 10) / image.frame.realHeight);
            image.setScale(scale);
          }
          if (mode === "puzzle") image.setAlpha(button.classList.contains("slot") && !button.classList.contains("filled") ? 0.23 : 1);
          if (tile.up !== up) {
            tile.up = up;
            if (mode === "memory") {
              this.tweens.killTweensOf(tile);
              if (reducedMotion) tile.openness = up ? 1 : 0;
              else this.tweens.add({ targets: tile, openness: up ? 1 : 0, duration: 360, ease: "Sine.easeInOut" });
            } else if (up && !reducedMotion) {
              image.setAlpha(0.2);
              this.tweens.add({ targets: image, alpha: 1, duration: 240 });
            }
          }
        });
      },
    },
  });
  return {
    activate(action, index) {
      if (!alive || !activeScene || !onAction) return false;
      activeScene.events.emit("tile-action", action, index);
      return true;
    },
    destroy() {
    alive = false;
    activeScene = undefined;
    parent.classList.remove(`phaser-${mode}-ready`);
    game.destroy(true);
    overlay.remove();
  } };
}

/** One input scene for the playable rooms. HTML retains focus and keyboard activation. */
export function startRoomInput(target: HTMLElement, bridge: {
  ready(): void;
  find(target: EventTarget | null): HTMLElement | undefined;
  handlers(surface: HTMLElement): import("./games/stroke.js").StrokeHandlers | undefined;
}): () => void {
  type Point = import("./games/stroke.js").Point;
  let active: { pointer: Phaser.Input.Pointer; touchId?: number; surface: HTMLElement; previous: Point } | undefined;
  const host = document.createElement("div");
  host.hidden = true;
  host.setAttribute("aria-hidden", "true");
  target.append(host);

  function position(pointer: Phaser.Input.Pointer): Point | undefined {
    const event = pointer.event;
    if (event instanceof MouseEvent) return { x: event.clientX, y: event.clientY };
    if (event instanceof TouchEvent) {
      const touch = Array.from(event.changedTouches).find((touch) => touch.identifier === pointer.identifier);
      if (touch) return { x: touch.clientX, y: touch.clientY };
    }
  }

  function cancel(): void {
    const stroke = active;
    active = undefined;
    if (stroke) bridge.handlers(stroke.surface)?.end();
  }

  new Phaser.Game({
    type: Phaser.CANVAS,
    parent: host,
    width: 1,
    height: 1,
    audio: { noAudio: true },
    input: {
      keyboard: false,
      mouse: { target, preventDefaultMove: false },
      touch: { target, capture: false },
    },
    scene: {
      create() {
        const down = (pointer: Phaser.Input.Pointer): void => {
          if (pointer.event instanceof MouseEvent && pointer.event.button !== 0) return;
          if (active && active.surface.isConnected && bridge.handlers(active.surface)) return;
          const surface = bridge.find(pointer.downElement);
          const point = position(pointer);
          if (!surface || !point) return;
          active = {
            pointer,
            touchId: pointer.event instanceof TouchEvent ? pointer.identifier : undefined,
            surface,
            previous: point,
          };
          bridge.handlers(surface)?.start(point);
        };
        const move = (pointer: Phaser.Input.Pointer): void => {
          if (active?.pointer !== pointer || active.touchId !== undefined) return;
          const point = position(pointer);
          if (!point) return;
          const previous = active.previous;
          active.previous = point;
          bridge.handlers(active.surface)?.move(previous, point);
        };
        const up = (pointer: Phaser.Input.Pointer): void => {
          if (active?.pointer !== pointer) return;
          if (pointer.wasCanceled) {
            cancel();
            return;
          }
          const stroke = active;
          active = undefined;
          const point = position(pointer);
          const handlers = bridge.handlers(stroke.surface);
          if (point) handlers?.move(stroke.previous, point);
          if (stroke.surface.isConnected) handlers?.end(point);
        };
        // Phaser limits touchmove to the canvas. Accessible controls sit above it.
        target.addEventListener("touchmove", (event) => {
          const stroke = active;
          if (stroke?.touchId === undefined) return;
          const touch = Array.from(event.changedTouches).find((touch) => touch.identifier === stroke.touchId);
          if (!touch) return;
          const point = { x: touch.clientX, y: touch.clientY };
          const previous = stroke.previous;
          stroke.previous = point;
          bridge.handlers(stroke.surface)?.move(previous, point);
          // A completed gesture can replace its original touch target mid-stroke.
          if (!stroke.surface.isConnected && active === stroke) {
            active = undefined;
            stroke.pointer.reset();
          }
        }, { passive: true });
        this.input.on("pointerdown", down);
        this.input.on("pointerdownoutside", down);
        this.input.on("pointermove", move);
        this.input.on("pointerup", up);
        this.input.on("pointerupoutside", up);
        this.game.events.on("blur", cancel);
        bridge.ready();
      },
    },
  });
  return cancel;
}

export interface CropView {
  setFrame(frame: string): void;
  destroy(): void;
}

export function createCropView(parent: HTMLElement, crop: string, initialFrame: string): CropView {
  const texture = "garden-v6-crop";
  const root = new URL(`./assets/nabby-garden-v6/${crop}/`, document.baseURI);
  let alive = true;
  let frame = initialFrame;
  let plant: Phaser.GameObjects.Image | undefined;
  let scene: Phaser.Scene | undefined;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const game = new Phaser.Game({
    type: Phaser.CANVAS, parent, transparent: true, width: 320, height: 230,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: {
      preload() {
        this.load.atlas(texture, new URL(crop + ".webp", root).href, new URL(crop + ".json", root).href);
      },
      create() {
        if (!alive || !this.textures.exists(texture)) return;
        scene = this;
        plant = this.add.image(160, 187, texture).setOrigin(0.5, 1);
        parent.classList.add("garden-crop-rendered");
        update(false);
      },
    },
  });

  function update(animate: boolean): void {
    if (!plant || !scene) return;
    scene.tweens.killTweensOf(plant);
    const visible = !!frame && scene.textures.get(texture).has(frame);
    plant.setVisible(visible);
    if (!visible) return;
    const scale = frame.endsWith("_seed") ? 0.25 : 0.65;
    plant.setFrame(frame).setScale(scale);
    if (animate && !reduced) {
      plant.setScale(scale * 0.9);
      scene.tweens.add({ targets: plant, scale, duration: 180 });
    }
  }

  return {
    setFrame(next) { frame = next; update(true); },
    destroy() { alive = false; parent.classList.remove("garden-crop-rendered"); game.destroy(true); },
  };
}
