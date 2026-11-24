import { el } from "../dom.js";
import { ding, unlock } from "../audio.js";
import { feedback, finish, heading, progress, setAction } from "../ui.js";
import { bindStroke, stopStroke, type Point } from "./stroke.js";
import type { CropView } from "../phaser-room.js";

const crops = {
  strawberry: { name: "Mansikka", phases: ["flower", "ripe", "post_harvest"], harvest: "Poimi mansikat" },
  sunflower: { name: "Auringonkukka", phases: ["bud", "bloom", "seed_head"], harvest: "Kerää siemenet" },
  carrot: { name: "Porkkana", phases: ["growing", "ripe", "harvested"], harvest: "Nosta porkkana" },
  magic_flower: { name: "Taikakukka", phases: ["bud", "bloom", "post_harvest"], harvest: "Kerää taikaterälehti" },
} as const;

type Crop = keyof typeof crops;

export const cropLevels: ReadonlyArray<readonly Crop[]> = [
  ["strawberry"],
  ["sunflower"],
  ["carrot"],
  ["magic_flower"],
  ["strawberry", "carrot"],
  ["sunflower", "magic_flower"],
  ["carrot", "sunflower"],
  ["magic_flower", "strawberry"],
  ["strawberry", "carrot", "sunflower"],
  ["sunflower", "carrot", "magic_flower"],
];

export function openCropGarden(field: HTMLElement, order?: readonly Crop[]): () => void {
  let alive = true;
  let view: CropView | undefined;
  let plot: HTMLButtonElement | undefined;
  let tool: HTMLButtonElement | undefined;
  let bedIndex = 0;
  const orderList = document.querySelector<HTMLOListElement>("#gf-garden-order")!;

  function releaseBed(): void {
    if (plot) stopStroke(plot);
    if (tool) stopStroke(tool);
    plot = tool = undefined;
    view?.destroy();
    view = undefined;
    field.replaceChildren();
  }

  function showOrder(harvested: boolean): void {
    if (!order) return;
    orderList.replaceChildren(...order.map((id, index) => {
      const item = document.createElement("li");
      const complete = index < bedIndex || (harvested && index === bedIndex);
      item.textContent = crops[id].name;
      if (complete) item.setAttribute("aria-label", crops[id].name + ", korjattu");
      if (index === bedIndex && !harvested) item.setAttribute("aria-current", "step");
      item.dataset.harvested = String(complete);
      return item;
    }));
  }
  field.classList.add("garden-crop-field");
  field.removeAttribute("data-stage");
  field.setAttribute("aria-label", "Kasvatuspenkki");
  field.replaceChildren();
  heading("fairy", "Kasvata kasvi", "Valitse siemen.", "Kisukeijun puutarha");
  feedback("");
  progress(0, 1);
  orderList.hidden = !order;
  if (order) showOrder(false);
  else {
    const choices = document.createElement("div");
    choices.className = "garden-crop-choices";
    field.append(choices);
    for (const id of Object.keys(crops) as Crop[]) {
      const choice = document.createElement("button");
      choice.type = "button";
      choice.textContent = crops[id].name;
      choice.onclick = () => start(id);
      choices.append(choice);
    }
    choices.querySelector("button")!.focus({ preventScroll: true });
  }

  function start(id: Crop): void {
    const crop = crops[id];
    const title = el("title");
    title.textContent = order
      ? `${crop.name} · kasvupaikka ${bedIndex + 1} / ${order.length}`
      : crop.name + " · kasvatus";
    const frames = ["seed", "", "sprout", "young", ...crop.phases]
      .map((suffix) => suffix && id + "_" + suffix);
    const instructions = [
      "Kuohkeuta multa", "Kylvä siemen", "Kastele siemen", "Kastele itu",
      "Siisti kasvupaikka", "Kastele kasvi", crop.harvest,
    ];
    const states = ["Kuiva multa", "Istutuskuoppa", "Kylvetty siemen", "Itu", "Taimi",
      "Kasvava kasvi", "Korjuuvalmis kasvi", "Sadonkorjuu valmis"];
    const toolArt = ["garden-shovel", "", "watering-icon", "watering-icon", "garden-brush", "watering-icon", ""];
    let phase = 0;
    const watering = () => phase === 2 || phase === 3 || phase === 5;
    let dragStart: Point;
    let dragged = false;
    let misses = 0;

    const art = document.createElement("div");
    art.className = "garden-crop-art";
    art.setAttribute("aria-hidden", "true");
    const target = document.createElement("button");
    target.type = "button";
    target.className = "garden-crop-plot";
    plot = target;
    const action = document.createElement("button");
    action.type = "button";
    action.className = "garden-crop-tool";
    tool = action;
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    action.append(icon, label);
    field.replaceChildren(art, target, action);

    function render(): void {
      const instruction = instructions[phase];
      target.dataset.soil = phase === 0 ? "dry" : phase === 1 ? "dug" : phase === 2 ? "sown" : "wet";
      target.textContent = states[phase];
      target.setAttribute("aria-label", instruction ? instruction + " · " + states[phase] : states[phase]);
      field.dataset.cropPhase = String(phase);
      field.dataset.cropFrame = frames[phase - 1] || "";
      if (phase === 0) field.dataset.cropFrame = "";
      view?.setFrame(field.dataset.cropFrame);
      if (order) progress(bedIndex + Number(phase === instructions.length), order.length);
      else progress(phase, instructions.length);
      if (instruction) {
        el("instruction").textContent = instruction + ". Napauta työkalua tai kasvupaikkaa.";
        icon.className = toolArt[phase];
        label.textContent = instruction;
      }
    }

    function advance(): void {
      if (phase >= instructions.length) return;
      unlock();
      ding("sprinkle");
      phase++;
      misses = 0;
      feedback("");
      target.classList.remove("garden-crop-hint");
      render();
      if (phase < instructions.length) return;
      action.hidden = true;
      target.setAttribute("aria-disabled", "true");
      el("instruction").textContent = crop.name + " on korjattu.";
      showOrder(true);
      const next = order?.[bedIndex + 1];
      setAction(next ? "Seuraava kasvupaikka" : "Juhlitaan!", () => {
        releaseBed();
        if (next) {
          bedIndex++;
          showOrder(false);
          setAction("", null);
          start(next);
        } else {
          finish("Sato on valmis!", bedIndex ? "Korjasit kaikki tason sadot!" : crop.name + " kasvoi hienosti.", "fairy");
        }
      });
      el("action").focus({ preventScroll: true });
    }

    action.onclick = (event) => {
      if (!dragged || event.detail === 0) advance();
    };
    target.onclick = (event) => {
      if (!dragged || event.detail === 0) advance();
    };
    bindStroke(action, {
      start(point) {
        dragStart = point;
        dragged = false;
      },
      move(_previous, point) {
        if (watering() && Math.hypot(point.x - dragStart.x, point.y - dragStart.y) > 12)
          field.classList.add("garden-crop-watering");
        action.style.translate = `${point.x - dragStart.x}px ${point.y - dragStart.y}px`;
      },
      end(point) {
        field.classList.remove("garden-crop-watering");
        action.style.removeProperty("translate");
        if (!point || Math.hypot(point.x - dragStart.x, point.y - dragStart.y) < 12) return;
        dragged = true;
        const rect = art.getBoundingClientRect();
        if (point.x >= rect.left && point.x <= rect.right &&
            point.y >= rect.top && point.y <= target.getBoundingClientRect().bottom) advance();
        else {
          feedback("Kokeile kasvupaikkaa.");
          if (++misses >= 2) target.classList.add("garden-crop-hint");
        }
      },
    });
    bindStroke(target, {
      start(point) { dragStart = point; dragged = false; },
      move() {},
      end(point) {
        if (point && id === "carrot" && phase === 6 && dragStart.y - point.y > 24) {
          dragged = true;
          advance();
        }
      },
    });
    render();
    action.focus({ preventScroll: true });
    void import("../phaser-room.js").then(({ createCropView }) => {
      if (!alive || !art.isConnected) return;
      view = createCropView(art, id, field.dataset.cropFrame ?? "");
    }).catch(() => {});
  }

  if (order) start(order[0]);

  return () => {
    alive = false;
    releaseBed();
    orderList.hidden = true;
    orderList.replaceChildren();
    field.classList.remove("garden-crop-field", "garden-crop-watering");
    field.removeAttribute("data-crop-phase");
    field.removeAttribute("data-crop-frame");
    field.setAttribute("aria-label", "Kukkapenkki");
  };
}
