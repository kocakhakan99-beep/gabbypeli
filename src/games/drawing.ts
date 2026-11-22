import { el } from "../dom.js";
import { heading, progress, feedback, finish, setAction } from "../ui.js";
import { say, ding } from "../audio.js";
import { bindStroke, type Point } from "./stroke.js";

type Stroke = { color: string; width: number; stamp: boolean; points: Point[] };
let strokes: Stroke[] = [];

export function startDrawing(): void {
  heading(
    "gabby",
    "Piirrä oma taikakuva",
    "Valitse väri ja liu’uta sormea paperilla.",
    "Taidepöytä",
  );
  const canvas = el("drawing-paper");
  const context = canvas.getContext("2d");
  if (!context) return;
  const palette = el("drawing-colors");
  const brush = el("drawing-brush");
  const stamp = el("drawing-stamp");
  const undo = el("drawing-undo");
  const colors = Array.from(
    palette.querySelectorAll<HTMLButtonElement>("button"),
  );
  let color = colors[0].value;
  let wide = false;
  let stamping = false;
  let active: Stroke | undefined;
  strokes = [];
  progress(0, 1);
  feedback("");
  say("Valitse väri. Piirrä sormella oma kuva.");

  function paint(stroke: Stroke, from: Point, to: Point): void {
    if (!context) return;
    if (stroke.stamp) {
      context.fillStyle = stroke.color;
      const radius = stroke.width;
      for (const [x, y, w, h] of [
        [0, 0.24, 0.58, 0.43],
        [-0.66, -0.28, 0.25, 0.31],
        [-0.24, -0.68, 0.25, 0.32],
        [0.24, -0.68, 0.25, 0.32],
        [0.66, -0.28, 0.25, 0.31],
      ]) {
        context.beginPath();
        context.ellipse(
          to.x + x * radius,
          to.y + y * radius,
          w * radius,
          h * radius,
          0,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
      return;
    }
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.width;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x + (from === to ? 0.01 : 0), to.y);
    context.stroke();
  }

  function update(): void {
    undo.disabled = strokes.length === 0;
    progress(strokes.length ? 1 : 0, 1);
    setAction(
      strokes.length ? "Kuva on valmis" : "",
      strokes.length
        ? () => finish("Hieno taikakuva!", "Sait taiteilijan tarran!", "gabby")
        : null,
    );
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  colors.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.value === color));
    button.onclick = () => {
      color = button.value;
      colors.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    };
  });
  brush.setAttribute("aria-pressed", "false");
  brush.onclick = () => {
    wide = !wide;
    brush.setAttribute("aria-pressed", String(wide));
  };
  stamp.setAttribute("aria-pressed", "false");
  stamp.onclick = () => {
    stamping = !stamping;
    stamp.setAttribute("aria-pressed", String(stamping));
    el("instruction").textContent = stamping
      ? "Napauta paperia tai piirrä tassupolku."
      : "Valitse väri ja liu’uta sormea paperilla.";
  };
  undo.onclick = () => {
    active = undefined;
    strokes.pop();
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      let previous = stroke.points[0];
      for (const point of stroke.points) {
        paint(stroke, previous, point);
        previous = point;
      }
    }
    update();
  };

  const toCanvas = (point: Point): Point => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((point.x - rect.left) * canvas.width) / rect.width,
      y: ((point.y - rect.top) * canvas.height) / rect.height,
    };
  };
  bindStroke(canvas, {
    start(point) {
      if (strokes.length >= 300) return;
      const first = toCanvas(point);
      active = {
        color,
        width: wide ? 36 : stamping ? 23 : 14,
        stamp: stamping,
        points: [first],
      };
      strokes.push(active);
      paint(active, first, first);
      if (strokes.length === 1) {
        update();
        ding("sprinkle");
      }
    },
    move(_from, to) {
      if (!active || active.points.length >= 3000) return;
      const next = toCanvas(to);
      const previous = active.points.at(-1)!;
      if (!active.stamp) {
        paint(active, previous, next);
        active.points.push(next);
        return;
      }
      const dx = next.x - previous.x;
      const dy = next.y - previous.y;
      const distance = Math.hypot(dx, dy);
      const spacing = active.width * 2.4;
      for (
        let offset = spacing;
        offset <= distance && active.points.length < 3000;
        offset += spacing
      ) {
        const point = {
          x: previous.x + (dx * offset) / distance,
          y: previous.y + (dy * offset) / distance,
        };
        paint(active, point, point);
        active.points.push(point);
      }
    },
    end() {
      active = undefined;
    },
  });
  update();
}
