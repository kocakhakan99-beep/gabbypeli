import { el } from "../dom.js";
import { heading, progress, feedback, finish, setAction } from "../ui.js";
import { say, ding } from "../audio.js";
import { bindStroke } from "./stroke.js";
import { friends } from "../data.js";
let strokes = [];
export function startDrawing() {
    heading("gabby", "Piirrä oma taikakuva", "Valitse väri tai hahmo ja liu’uta sormea paperilla.", "Taidepöytä");
    const canvas = el("drawing-paper");
    const context = canvas.getContext("2d");
    if (!context)
        return;
    const palette = el("drawing-colors");
    const brush = el("drawing-brush");
    const stamp = el("drawing-stamp");
    const undo = el("drawing-undo");
    const friendStamps = Array.from(el("drawing").querySelectorAll("[data-friend-stamp]"));
    const characterImages = new Map();
    const colors = Array.from(palette.querySelectorAll("button"));
    let color = colors[0].value;
    let wide = false;
    let selectedStamp = null;
    let active;
    strokes = [];
    progress(0, 1);
    feedback("");
    say("Valitse väri tai hahmo. Piirrä sormella oma kuva.");
    function paint(stroke, from, to) {
        if (!context)
            return;
        if (stroke.stamp?.kind === "friend") {
            const characterImage = characterImages.get(stroke.stamp.tile);
            if (!characterImage?.complete || !characterImage.naturalWidth)
                return;
            const size = stroke.width;
            context.drawImage(characterImage, to.x - size / 2, to.y - size / 2, size, size);
            context.fillStyle = "#ffe28a";
            for (const [x, y] of [
                [-0.42, -0.4],
                [0.42, -0.4],
                [-0.42, 0.4],
                [0.42, 0.4],
            ]) {
                context.beginPath();
                context.arc(to.x + x * size, to.y + y * size, 4, 0, Math.PI * 2);
                context.fill();
            }
            return;
        }
        if (stroke.stamp?.kind === "paw") {
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
                context.ellipse(to.x + x * radius, to.y + y * radius, w * radius, h * radius, 0, 0, Math.PI * 2);
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
    function redraw() {
        if (!context)
            return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (const stroke of strokes) {
            let previous = stroke.points[0];
            for (const point of stroke.points) {
                paint(stroke, previous, point);
                previous = point;
            }
        }
    }
    for (const friend of friends) {
        if (friend.tile === undefined)
            continue;
        const image = new Image();
        image.addEventListener("load", redraw, { once: true });
        image.src = new URL(`../../assets/friends/${friend.id}.webp`, import.meta.url).href;
        characterImages.set(friend.tile, image);
    }
    function updateStampSelection() {
        stamp.setAttribute("aria-pressed", String(selectedStamp?.kind === "paw"));
        const selectedFriendTile = selectedStamp?.kind === "friend" ? selectedStamp.tile : undefined;
        const selectedFriendId = friends.find((friend) => friend.tile === selectedFriendTile)?.id;
        friendStamps.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.friendStamp === selectedFriendId)));
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
    stamp.setAttribute("aria-pressed", "false");
    stamp.onclick = () => {
        selectedStamp = selectedStamp?.kind === "paw" ? null : { kind: "paw" };
        updateStampSelection();
        el("instruction").textContent =
            selectedStamp?.kind === "paw"
                ? "Napauta paperia tai piirrä tassupolku."
                : "Valitse hahmotarra tai piirrä väreillä.";
    };
    friendStamps.forEach((button) => {
        button.onclick = () => {
            const id = button.dataset.friendStamp;
            const friend = friends.find((item) => item.id === id);
            if (!friend || friend.tile === undefined)
                return;
            selectedStamp = { kind: "friend", tile: friend.tile };
            updateStampSelection();
            el("instruction").textContent =
                "Liu’uta sormea paperilla ja tee " + friend.name + " -tarrapolku.";
            feedback("Valittu hahmo ilmestyy paperille sormesi mukana.");
        };
    });
    undo.onclick = () => {
        active = undefined;
        strokes.pop();
        redraw();
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
            const drawStamp = selectedStamp;
            active = {
                color,
                width: drawStamp?.kind === "friend"
                    ? wide
                        ? 148
                        : 116
                    : wide
                        ? 36
                        : drawStamp?.kind === "paw"
                            ? 23
                            : 14,
                stamp: drawStamp,
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
            if (!active || active.points.length >= 3000)
                return;
            const next = toCanvas(to);
            const previous = active.points.at(-1);
            if (!active.stamp) {
                paint(active, previous, next);
                active.points.push(next);
                return;
            }
            const dx = next.x - previous.x;
            const dy = next.y - previous.y;
            const distance = Math.hypot(dx, dy);
            const spacing = active.stamp?.kind === "friend"
                ? active.width * 1.18
                : active.width * 2.4;
            for (let offset = spacing; offset <= distance && active.points.length < 3000; offset += spacing) {
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
