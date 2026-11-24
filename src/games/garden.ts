import { cropLevels, openCropGarden } from "./garden-crops.js";
import { campaignLevel } from "../campaign.js";
import {
  advanceAfterSuccess,
  button,
  heading,
  progress,
  feedback,
  finish,
  setAction,
} from "../ui.js";
import { el } from "../dom.js";
import { ding, unlock } from "../audio.js";
import { bindStroke, distanceToStroke, stopStroke, type Point } from "./stroke.js";

const beds = [
  [24, 49, 76],
  [17, 37, 60, 82],
];
const colors = ["#ff88bc", "#ffd778", "#ba96ff", "#ffa6c9"];
type Stage = "soil" | "water" | "tidy";

let gardenView: { destroy(): void } | undefined;
let gardenGeneration = 0;
let stopCropGarden: (() => void) | undefined;

export function stopGarden(): void {
  gardenGeneration++;
  stopCropGarden?.();
  stopCropGarden = undefined;
  gardenView?.destroy();
  gardenView = undefined;
}

export function startGarden(): void {
  const level = campaignLevel();
  const order = level === undefined ? undefined : cropLevels[level - 1];
  const launcher = document.querySelector<HTMLButtonElement>("#gf-garden-grow")!;
  const classic = document.querySelector<HTMLButtonElement>("#gf-garden-classic")!;
  launcher.parentElement!.hidden = !!order;

  function grow(): void {
    const field = el("garden-field");
    stopStroke(field);
    stopGarden();
    setAction("", null);
    launcher.setAttribute("aria-pressed", "true");
    classic.setAttribute("aria-pressed", "false");
    stopCropGarden = openCropGarden(field, order);
  }

  launcher.onclick = grow;
  classic.onclick = () => {
    launcher.setAttribute("aria-pressed", "false");
    classic.setAttribute("aria-pressed", "true");
    plantBed(0);
  };
  grow();
}

function plantBed(level: number): void {
  stopStroke(el("garden-field"));
  stopGarden();
  const generation = gardenGeneration;
  const field = el("garden-field");
  const bedCount = beds.length;
  const effort = 25;
  const row = beds[level];
  let amounts: number[] = row.map(() => 0);
  const flowers: HTMLButtonElement[] = [];
  let stage: Stage = "soil";
  let finished = false;
  let lastTick = 0;
  heading(
    "fairy",
    "Puutarhan pikku apuri",
    "Muokkaa multa, kastele kukat ja siisti penkki.",
    "Kisukeijun puutarha",
  );
  field.replaceChildren();
  field.dataset.stage = stage;
  const tool = document.createElement("span");
  tool.className = "garden-watering-can garden-tool";
  tool.setAttribute("aria-hidden", "true");
  tool.innerHTML =
    '<span class="garden-shovel"></span><span class="watering-icon"></span><span class="garden-drops"></span><span class="garden-brush"></span>';
  field.append(tool);
  row.forEach((x, index) => {
    const flower = button("", () => work(index, effort), "garden-flower");
    flower.setAttribute("aria-label", "Kukkapenkki " + (index + 1));
    flower.style.setProperty("--flower-x", x + "%");
    flower.style.setProperty("--flower-y", (index % 2 ? 48 : 58) + "%");
    flower.style.setProperty("--petal", colors[index]);
    flower.innerHTML =
      '<span class="garden-soil"></span><span class="garden-stem"></span><span class="garden-bud"></span><span class="garden-petals"></span><span class="garden-meter"><span></span></span><span class="garden-leaf"></span>';
    flowers.push(flower);
    field.append(flower);
  });
  void import("../phaser-room.js").then(({ createGardenView }) => {
    if (generation !== gardenGeneration || !field.isConnected) return;
    gardenView = createGardenView(field, flowers);
  }).catch(() => {});
  progress(0, row.length);
  feedback("Muokataan ensin multa lapiolla.");
  setAction("", null);

  function work(index: number, amount: number): void {
    if (finished || amounts[index] >= 100) return;
    unlock();
    amounts[index] = Math.min(100, amounts[index] + amount);
    const flower = flowers[index];
    flower.style.setProperty("--growth", String(amounts[index] / 100));
    flower.style.setProperty("--garden-progress", amounts[index] + "%");
    flower.setAttribute(
      "aria-label",
      `Kukkapenkki ${index + 1}, ${amounts[index]} prosenttia`,
    );
    if (amounts[index] < 100) return;
    flower.classList.add(stage + "-done");
    ding("sprinkle");
    progress(amounts.filter((value) => value === 100).length, row.length);
    if (!amounts.every((value) => value === 100)) return;
    if (stage === "soil") {
      stage = "water";
      feedback("Multa on valmis! Kastellaan kukat.");
    } else if (stage === "water") {
      stage = "tidy";
      feedback("Kukat kasvoivat! Siistitään lehdet.");
    } else {
      finished = true;
      feedback("Puutarha kukkii!");
      setAction(
        level + 1 < bedCount ? "Seuraava kukkapenkki" : "Juhlitaan!",
        () => {
          if (level + 1 < bedCount) plantBed(level + 1);
          else {
            stopGarden();
            finish("Puutarha kukkii!", "Sait puutarhurin tarran!", "fairy");
          }
        },
      );
      advanceAfterSuccess();
      return;
    }
    field.dataset.stage = stage;
    amounts = row.map(() => 0);
    flowers.forEach((item) => {
      item.style.setProperty("--garden-progress", "0%");
      item.style.setProperty("--growth", "0");
    });
    progress(0, row.length);
  }

  function move(from: Point, to: Point, force = false): void {
    const bounds = field.getBoundingClientRect();
    tool.style.left = to.x - bounds.left + "px";
    tool.style.top = to.y - bounds.top + "px";
    const now = performance.now();
    if (!force && now - lastTick < 100) return;
    lastTick = now;
    flowers.forEach((flower, index) => {
      const rect = flower.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      if (
        distanceToStroke(center, from, to) <=
        Math.min(rect.width, rect.height) * 0.7
      )
        work(index, effort);
    });
  }
  bindStroke(field, {
    start(point) {
      lastTick = 0;
      field.classList.add("watering");
      move(point, point, true);
    },
    move(from, to) {
      move(from, to);
    },
    end() {
      field.classList.remove("watering");
    },
  });
}
