import Phaser from "phaser";

export interface RoomItem {
  id: string;
  hidden: boolean;
}

export interface RoomView {
  reveal(index: number): void;
  destroy(): void;
}

/** Renders the first hide-and-seek room. The HTML buttons provide accessible input. */
export function createRoomView(parent: HTMLElement, items: RoomItem[]): RoomView {
  const furniture: Phaser.GameObjects.Image[] = [];
  const surprises: Phaser.GameObjects.Image[] = [];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let scene: Phaser.Scene | undefined;
  let ready = false;
  const pending = new Set<number>();

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
      object.setAlpha(0.2).setX(object.x - 105);
      return;
    }
    scene.tweens.add({ targets: object, x: object.x - 105, angle: -10, alpha: 0.25, duration: 500, ease: "Sine.easeInOut" });
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
        this.load.image("hidden-friend", "./assets/friends/gabby.webp");
        this.load.image("hidden-surprise", "./assets/objects/star.webp");
      },
      create() {
        scene = this;
        const positions = [[200, 140], [600, 140], [200, 420], [600, 420]];
        items.forEach((item, index) => {
          const [x, y] = positions[index];
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
  return { reveal, destroy: () => { parent.parentElement?.classList.remove("phaser-ready"); game.destroy(true); } };
}
