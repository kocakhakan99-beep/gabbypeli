import Phaser from "phaser";

export interface RoomItem {
  id: string;
  hidden: boolean;
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
        for (const item of items) this.load.image(item.id, `./assets/furniture/${item.id}.webp`);
        this.load.image("hidden-friend", `./assets/friends/${friend}.webp`);
        this.load.image("hidden-surprise", `./assets/objects/${surprise}.webp`);
      },
      create() {
        scene = this;
        const positions = [[200, 140], [600, 140], [200, 420], [600, 420]];
        items.forEach((item, index) => {
          const [x, y] = positions[index];
          originalX.push(x);
          const surprise = this.add.image(x, y, item.hidden ? "hidden-friend" : "hidden-surprise");
          surprise.setDisplaySize(135, 135).setVisible(false);
          surprises.push(surprise);
          const image = this.add.image(x, y, item.id);
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

/** Draws the spoon and batter as the player stirs the mixing bowl. */
export function createMixingView(parent: HTMLElement): MixingView {
  let scene: Phaser.Scene | undefined;
  let spoon: Phaser.GameObjects.Container | undefined;
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
    spoon.setRotation(Math.atan2(position.y - 0.5, position.x - 0.5) + 0.8);
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
      create() {
        if (!alive) return;
        scene = this;
        trails = this.add.graphics();
        const shadow = this.add.ellipse(8, 50, 38, 85, 0x8b5535, 0.25);
        const handle = this.add.rectangle(0, 32, 18, 100, 0xae6842).setOrigin(0.5, 0.15);
        const head = this.add.ellipse(0, 0, 48, 64, 0xd7925c);
        const highlight = this.add.ellipse(-6, -8, 20, 28, 0xf5bc80, 0.55);
        spoon = this.add.container(150, 150, [shadow, handle, head, highlight]);
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
export function createBakingTrayView(parent: HTMLElement, recipe: string): BakingTrayView {
  let scene: Phaser.Scene | undefined;
  let paper: Phaser.GameObjects.Rectangle | undefined;
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
      paper.setScale(0.92);
      scene.tweens.add({ targets: paper, scale: 1, duration: 250, ease: "Sine.easeOut" });
    }
  }

  function place(index: number): void {
    placed.add(index);
    if (!scene || drawn.has(index)) return;
    drawn.add(index);
    const x = 50 + (index % 3) * 100;
    const y = 27 + Math.floor(index / 3) * 54;
    const portion = thisScenePortion(scene, x, y, recipe);
    if (!reducedMotion) {
      portion.setScale(0.5);
      scene.tweens.add({ targets: portion, scale: 1, duration: 300, ease: "Back.easeOut" });
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
      create() {
        if (!alive) return;
        scene = this;
        paper = this.add.rectangle(150, 54, 296, 104, 0xfff0cf).setVisible(false);
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

function thisScenePortion(scene: Phaser.Scene, x: number, y: number, recipe: string): Phaser.GameObjects.Container {
  if (recipe === "cupcake") {
    const wrapper = scene.add.rectangle(0, 7, 28, 22, 0xb98bdb);
    const icing = scene.add.ellipse(0, -6, 34, 23, 0xffb5db);
    const highlight = scene.add.ellipse(-7, -9, 9, 5, 0xffedf7, 0.8);
    return scene.add.container(x, y, [wrapper, icing, highlight]);
  }
  const cookie = scene.add.ellipse(0, 0, 36, 33, 0xd39b61);
  const chips = [
    scene.add.circle(-8, -5, 3, 0x80442f),
    scene.add.circle(6, 6, 3, 0x80442f),
    scene.add.circle(8, -8, 2, 0x80442f),
  ];
  return scene.add.container(x, y, [cookie, ...chips]);
}

export interface OvenView {
  update(angle: number, heat: number): void;
  destroy(): void;
}

export function createOvenView(parent: HTMLElement): OvenView {
  let graphics: Phaser.GameObjects.Graphics | undefined;
  let angle = 0;
  let heat = 0;
  let alive = true;
  function update(nextAngle: number, nextHeat: number): void {
    angle = Phaser.Math.Clamp(nextAngle, 0, 65);
    heat = nextHeat;
    if (!graphics) return;
    graphics.clear();
    graphics.fillStyle(0xa05d96);
    graphics.fillCircle(40, 40, 21);
    graphics.lineStyle(4, 0xfff3d0);
    graphics.strokeCircle(40, 40, 21);
    const radians = Phaser.Math.DegToRad(heat - 90);
    graphics.lineStyle(5, 0xffffff);
    graphics.lineBetween(40 + Math.cos(radians) * 8, 40 + Math.sin(radians) * 8, 40 + Math.cos(radians) * 17, 40 + Math.sin(radians) * 17);
    const height = 125 * Math.cos(Phaser.Math.DegToRad(angle));
    const top = 205 - height;
    graphics.fillStyle(0x75b5c6, 0.55);
    graphics.fillRoundedRect(20, top, 280, height, 12);
    graphics.lineStyle(6, 0x73b9ae);
    graphics.strokeRoundedRect(20, top, 280, height, 12);
    graphics.fillStyle(0xffe1a5);
    graphics.fillRoundedRect(95, top + 12, 130, 8, 4);
  }
  const game = new Phaser.Game({
    type: Phaser.CANVAS, parent, transparent: true, width: 320, height: 230,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: { create() {
      if (!alive) return;
      graphics = this.add.graphics();
      parent.classList.add("phaser-oven-ready");
      update(angle, heat);
    } },
  });
  return { update, destroy() {
    alive = false;
    parent.classList.remove("phaser-oven-ready");
    game.destroy(true);
  } };
}

export interface PreparationView {
  setStage(stage: number): void;
  destroy(): void;
}

/** Animates washing and the ingredients accumulating in the bowl. */
export function createPreparationView(parent: HTMLElement, mode: "wash" | "ingredients"): PreparationView {
  let stage = 0;
  let alive = true;
  let graphics: Phaser.GameObjects.Graphics | undefined;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function draw(time: number): void {
    if (!graphics) return;
    graphics.clear();
    if (mode === "wash") {
      if (stage === 0) return;
      if (stage === 2) {
        graphics.lineStyle(12, 0x9fe8ff, 0.8);
        graphics.lineBetween(140, 94, 140, 166);
        for (let i = 0; i < 8; i++) {
          const y = 100 + ((i * 11 + (reducedMotion ? 0 : time / 18)) % 65);
          graphics.fillStyle(0xe5fbff, 0.9);
          graphics.fillEllipse(140, y, 9, 5);
        }
      }
      for (let i = 0; i < 12; i++) {
        const x = 125 + (i % 4) * 18;
        const y = 170 + Math.floor(i / 4) * 10 + (reducedMotion ? 0 : Math.sin(time / 240 + i) * 3);
        graphics.fillStyle(0xffffff, stage === 2 ? 0.45 : 0.85);
        graphics.fillCircle(x, y, 5 + (i % 3));
      }
      return;
    }
    if (stage & 1) {
      graphics.fillStyle(0xfff3d9);
      graphics.fillEllipse(150, 162, 145, 68);
    }
    if (stage & 2) {
      graphics.fillStyle(0xffbd4d);
      graphics.fillCircle(160, 150, 26);
      graphics.fillStyle(0xffe8a1, 0.8);
      graphics.fillEllipse(153, 144, 12, 9);
    }
    if (stage & 4) {
      graphics.fillStyle(0xfffdf2, 0.85);
      graphics.fillEllipse(150, 161, 170, 70);
    }
  }
  const game = new Phaser.Game({
    type: Phaser.CANVAS, parent, transparent: true, width: 300, height: 240,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: {
      create() {
        if (!alive) return;
        graphics = this.add.graphics();
        parent.classList.add("phaser-preparation-ready");
        draw(0);
      },
      update(time: number) { draw(time); },
    },
  });
  return {
    setStage(value) { stage = value; draw(0); },
    destroy() {
      alive = false;
      parent.classList.remove("phaser-preparation-ready");
      game.destroy(true);
    },
  };
}

export function createGardenView(parent: HTMLElement, flowers: HTMLButtonElement[]): { destroy(): void } {
  let alive = true;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const palette = [0xff88bc, 0xffd778, 0xba96ff, 0xffa6c9];
  let graphics: Phaser.GameObjects.Graphics;
  const game = new Phaser.Game({
    type: Phaser.CANVAS, parent, transparent: true,
    width: parent.clientWidth, height: parent.clientHeight,
    scale: { mode: Phaser.Scale.RESIZE },
    scene: {
      create() {
        if (!alive) return;
        graphics = this.add.graphics();
        parent.classList.add("phaser-garden-ready");
      },
      update(time: number) {
        if (!alive || !graphics) return;
        graphics.clear();
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        flowers.forEach((flower, index) => {
          const x = parseFloat(flower.style.getPropertyValue("--flower-x")) * width / 100;
          const y = parseFloat(flower.style.getPropertyValue("--flower-y")) * height / 100;
          const amount = Number(flower.style.getPropertyValue("--growth")) || 0;
          const grown = flower.classList.contains("water-done") ? 1 : parent.dataset.stage === "water" ? amount : 0;
          const sway = reducedMotion ? 0 : Math.sin(time / 700 + index) * grown * 3;
          graphics.fillStyle(flower.classList.contains("soil-done") ? 0x70482f : 0x936346);
          graphics.fillEllipse(x, y + 25, 65, 22);
          if (grown > 0) {
            graphics.lineStyle(5, 0x39834d);
            graphics.lineBetween(x, y + 23, x + sway, y - 30 * grown);
            graphics.fillStyle(0x65a852);
            graphics.fillEllipse(x + 10, y + 5, 22 * grown, 10 * grown);
            const top = y - 30 * grown;
            graphics.fillStyle(palette[index % palette.length]);
            for (let petal = 0; petal < 6; petal++) {
              const angle = petal * Math.PI / 3;
              graphics.fillCircle(x + sway + Math.cos(angle) * 13 * grown, top + Math.sin(angle) * 13 * grown, 10 * grown);
            }
            graphics.fillStyle(0xffed98);
            graphics.fillCircle(x + sway, top, 8 * grown);
          }
          if (parent.dataset.stage === "tidy" && !flower.classList.contains("tidy-done")) {
            graphics.fillStyle(0x99714a, 1 - amount);
            graphics.fillEllipse(x - 20, y + 20, 13, 6);
            graphics.fillEllipse(x + 22, y + 28, 12, 5);
          }
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
