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
