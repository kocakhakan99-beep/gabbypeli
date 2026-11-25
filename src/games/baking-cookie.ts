import { el } from "../dom.js";
import { feedback } from "../ui.js";
import type { StrokeHandlers, Point } from "./stroke.js";

type CookieWorkbench = {
  scene: HTMLElement;
  count: number;
  show(instruction: string, html: string): void;
  image(name: string): string;
  gesture(target: HTMLElement, handlers: StrokeHandlers): void;
  sound(): void;
  done(): void;
};

const W = 360;
const H = 265;
const cutterWidth = 82;
const cutterHeight = 74;
const catPath = "M4 48Q3 33 12 25L11 8Q12 0 20 4L32 15Q41 13 50 15L62 4Q70 0 71 8L70 25Q79 33 78 48Q76 70 41 71Q6 70 4 48Z";
const GRID = 4;
const template = Array.from({ length: 6 }, (_, i) => ({ x: 80 + i % 3 * 100, y: 80 + Math.floor(i / 3) * 108 }));
const snap = (value: number) => Math.round(value / GRID) * GRID;

export function cookieWorkbench({ scene, count, show, image, gesture, sound, done }: CookieWorkbench): void {
  show("Vie kaulinta ylös ja alas taikinan yli.", `
    <div class="cookie-board rolling">
      <div class="rolling-dough">${image("dough")}</div>
      <button class="cookie-roller" aria-label="Kauli taikina">${image("rolling-pin")}</button>
      <output class="cookie-roll-count" aria-live="polite">0 / 6</output>
    </div>`);
  const board = scene.querySelector<HTMLElement>(".cookie-board")!;
  const roller = scene.querySelector<HTMLButtonElement>(".cookie-roller")!;
  const dough = scene.querySelector<HTMLElement>(".rolling-dough")!;
  const counter = scene.querySelector<HTMLOutputElement>("output")!;
  let strokes = 0;
  let edge = 0;
  let last = 0;
  let anchor = 0;

  function advance(): void {
    if (strokes >= 6) return;
    strokes++;
    counter.value = `${strokes} / 6`;
    board.dataset.rolled = String(Math.floor(strokes / 2));
    if (strokes % 2 === 0) {
      dough.innerHTML = image(`dough-sheet-${strokes / 2}`);
      sound();
    }
    if (strokes === 6) cutting();
  }

  function rollingPosition(point: Point): number {
    const box = board.getBoundingClientRect();
    return (point.y - box.top) / box.height;
  }

  gesture(roller, {
    start(point) {
      const position = parseFloat(roller.style.top || "27") / 100;
      anchor = rollingPosition(point) - position;
      edge = position <= .29 ? -1 : position >= .71 ? 1 : 0;
    },
    move(_from, point) {
      const box = board.getBoundingClientRect();
      const position = rollingPosition(point) - anchor;
      roller.style.top = `${Math.max(23, Math.min(77, position * 100))}%`;
      if (point.x < box.left || point.x > box.right) {
        edge = 0;
        return;
      }
      const next = position <= .29 ? -1 : position >= .71 ? 1 : 0;
      if (!next || edge === next) return;
      if (edge && last !== next) {
        last = next;
        advance();
      }
      edge = next;
    },
    end() {},
  });
  roller.onclick = (event) => {
    if (event.detail) return;
    roller.style.top = strokes % 2 ? "26%" : "74%";
    advance();
  };

  function cutting(): void {
    show("Vedä muotti taikinaan ja vie leikattu pipari lautaselle.", `
      <div class="cookie-cut-stage">
        <div class="cookie-board cookie-cut-board">
          <svg class="cookie-dough-sheet" viewBox="0 0 ${W} ${H}" aria-hidden="true">
            <defs>
              <mask id="cookie-holes" maskUnits="userSpaceOnUse">
                <rect width="${W}" height="${H}" fill="white"/>
              </mask>
            </defs>
            <g mask="url(#cookie-holes)">${image("dough-sheet-3").replace("<svg ", `<svg width="${W}" height="${H}" `)}</g>
            <path class="cookie-cutter-preview" d="${catPath}" visibility="hidden"/>
          </svg>
        </div>
        <div class="cookie-cut-tools">
          <button class="cookie-cutter" aria-label="Paina kissamuottia">
            <svg viewBox="0 0 ${cutterWidth} ${cutterHeight}" aria-hidden="true">
              <path class="cookie-cutter-inset" d="${catPath}"/>
              <path d="${catPath}" fill="none" stroke="#774da1" stroke-width="7"/>
              <path d="${catPath}" fill="none" stroke="#d3a9ef" stroke-width="4"/>
            </svg>
          </button>
          <div class="cookie-plate" aria-label="Raakojen piparien lautanen"></div>
        </div>
      </div>`);
    const stage = scene.querySelector<HTMLElement>(".cookie-cut-stage")!;
    const work = stage.querySelector<HTMLElement>(".cookie-cut-board")!;
    const plate = stage.querySelector<HTMLElement>(".cookie-plate")!;
    const tool = stage.querySelector<HTMLButtonElement>(".cookie-cutter")!;
    const mask = stage.querySelector<SVGMaskElement>("mask")!;
    const preview = stage.querySelector<SVGPathElement>(".cookie-cutter-preview")!;
    const footprint: Point[] = [];
    for (let y = -36; y <= 36; y += GRID) {
      for (let x = -40; x <= 40; x += GRID) {
        if (preview.isPointInFill(new DOMPoint(x + cutterWidth / 2, y + cutterHeight / 2))) footprint.push({ x, y });
      }
    }
    const footprintCells = new Set(footprint.map(({ x, y }) => `${x},${y}`));
    let holes: Point[] = [];
    let held = false;
    let placed = 0;
    let keyboardPoint = template[0];
    let dragStart: Point;
    let grab: Point;

    function transform(point: Point): string {
      return `translate(${point.x - cutterWidth / 2} ${point.y - cutterHeight / 2})`;
    }

    function valid(point: Point): boolean {
      if (point.x < 60 || point.x > 300 || point.y < 60 || point.y > 208) return false;
      return holes.every((hole) => {
        const dx = point.x - hole.x;
        const dy = point.y - hole.y;
        if (Math.abs(dx) >= cutterWidth || Math.abs(dy) >= cutterHeight) return true;
        return !footprint.some(({ x, y }) => footprintCells.has(`${x + dx},${y + dy}`));
      });
    }

    function nearestOpen(): Point | undefined {
      const preferred = template.find(valid);
      if (preferred) return preferred;
      for (let y = 60; y <= 208; y += GRID) {
        for (let x = 60; x <= 300; x += GRID) {
          if (valid({ x, y })) return { x, y };
        }
      }
    }

    function cut(point: Point): void {
      if (held) return;
      if (!valid(point)) {
        feedback("Valitse taikinasta vapaa kohta, johon koko muotti mahtuu.");
        return;
      }
      feedback("");
      const hole = document.createElementNS("http://www.w3.org/2000/svg", "path");
      hole.setAttribute("d", catPath);
      hole.setAttribute("transform", transform(point));
      hole.setAttribute("fill", "black");
      mask.append(hole);
      holes.push(point);
      held = true;
      tool.classList.add("holding-dough");
      el("instruction").textContent = "Vie muotissa oleva pipari lautaselle.";
      sound();
    }

    function unload(): void {
      if (!held || placed >= count) return;
      held = false;
      tool.classList.remove("holding-dough");
      plate.insertAdjacentHTML("beforeend", image("cat-cutout"));
      sound();
      if (++placed === count) {
        done();
        return;
      }
      const available = nearestOpen();
      if (!available) {
        while (mask.children.length > 1) mask.lastElementChild?.remove();
        holes = [];
        feedback("Lopputaikina levitettiin uudelleen. Lautasella olevat piparit säilyivät.");
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
          work.animate([{ opacity: .5 }, { opacity: 1 }], 230);
      }
      keyboardPoint = nearestOpen()!;
      el("instruction").textContent = "Leikkaa seuraava pipari taikinasta.";
    }

    const local = (point: Point): Point => {
      const box = work.getBoundingClientRect();
      return { x: snap((point.x - box.left) * W / box.width), y: snap((point.y - box.top) * H / box.height) };
    };
    function aim(point: Point): void {
      preview.setAttribute("transform", transform(point));
      preview.setAttribute("visibility", valid(point) && !held ? "visible" : "hidden");
    }
    function centerAt(point: Point): Point {
      return { x: point.x + grab.x, y: point.y + grab.y };
    }

    gesture(tool, {
      start(point) {
        dragStart = point;
        const box = tool.getBoundingClientRect();
        grab = { x: box.left + box.width / 2 - point.x, y: box.top + box.height / 2 - point.y };
      },
      move(_from, point) {
        tool.style.translate = `${point.x - dragStart.x}px ${point.y - dragStart.y}px`;
        aim(local(centerAt(point)));
      },
      end(point) {
        tool.style.removeProperty("translate");
        preview.setAttribute("visibility", "hidden");
        if (!point) return;
        const center = centerAt(point);
        if (!held) {
          cut(local(center));
          return;
        }
        const box = plate.getBoundingClientRect();
        if (center.x >= box.left && center.x <= box.right && center.y >= box.top && center.y <= box.bottom) unload();
      },
    });
    tool.onkeydown = (event) => {
      if (!event.key.startsWith("Arrow") || held) return;
      event.preventDefault();
      const dx = event.key === "ArrowLeft" ? -12 : event.key === "ArrowRight" ? 12 : 0;
      const dy = event.key === "ArrowUp" ? -12 : event.key === "ArrowDown" ? 12 : 0;
      keyboardPoint = { x: Math.max(60, Math.min(300, keyboardPoint.x + dx)), y: Math.max(60, Math.min(208, keyboardPoint.y + dy)) };
      aim(keyboardPoint);
    };
    tool.onclick = (event) => {
      if (event.detail || placed >= count) return;
      if (held) unload();
      else cut(keyboardPoint);
    };
  }
}
