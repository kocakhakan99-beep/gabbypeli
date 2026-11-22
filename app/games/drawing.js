import { el } from "../dom.js";
import { heading, progress, feedback, finish, setAction } from "../ui.js";
import { say, ding } from "../audio.js";
import { bindStroke } from "./stroke.js";
let strokes = [];
export function startDrawing() {
    heading("gabby", "Piirrä oma taikakuva", "Valitse väri ja liu’uta sormea paperilla.", "Taidepöytä");
    const canvas = el("drawing-paper");
    const context = canvas.getContext("2d");
    if (!context)
        return;
    const palette = el("drawing-colors");
    const brush = el("drawing-brush");
    const undo = el("drawing-undo");
    const colors = Array.from(palette.querySelectorAll("button"));
    let color = colors[0].value;
    let wide = false;
    let active;
    strokes = [];
    progress(0, 1);
    feedback("");
    say("Valitse väri. Piirrä sormella oma kuva.");
    function paint(stroke, from, to) {
        if (!context)
            return;
        context.strokeStyle = stroke.color;
        context.lineWidth = stroke.width;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x + (from === to ? 0.01 : 0), to.y);
        context.stroke();
    }
    function update() {
        undo.disabled = strokes.length === 0;
        progress(strokes.length ? 1 : 0, 1);
        setAction(strokes.length ? "Kuva on valmis" : "", strokes.length
            ? () => finish("Hieno taikakuva!", "Sait taiteilijan tarran!", "gabby")
            : null);
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    colors.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.value === color));
        button.onclick = () => {
            color = button.value;
            colors.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        };
    });
    brush.setAttribute("aria-pressed", "false");
    brush.onclick = () => {
        wide = !wide;
        brush.setAttribute("aria-pressed", String(wide));
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
    const toCanvas = (point) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((point.x - rect.left) * canvas.width) / rect.width,
            y: ((point.y - rect.top) * canvas.height) / rect.height,
        };
    };
    bindStroke(canvas, {
        start(point) {
            if (strokes.length >= 300)
                return;
            const first = toCanvas(point);
            active = { color, width: wide ? 36 : 14, points: [first] };
            strokes.push(active);
            paint(active, first, first);
            if (strokes.length === 1) {
                update();
                ding("sprinkle");
            }
        },
        move(_from, to) {
            if (!active || active.points.length >= 3000)
                return;
            const next = toCanvas(to);
            paint(active, active.points.at(-1), next);
            active.points.push(next);
        },
        end() {
            active = undefined;
        },
    });
    update();
}
