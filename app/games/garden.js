import { advanceAfterSuccess, button, heading, progress, feedback, finish, setAction, } from "../ui.js";
import { el } from "../dom.js";
import { ding, unlock } from "../audio.js";
import { bindStroke, distanceToStroke } from "./stroke.js";
const beds = [
    [24, 49, 76],
    [17, 37, 60, 82],
];
const colors = ["#ff88bc", "#ffd778", "#ba96ff", "#ffa6c9"];
let gardenView;
let gardenGeneration = 0;
export function stopGarden() {
    gardenGeneration++;
    gardenView?.destroy();
    gardenView = undefined;
}
export function startGarden() {
    plantBed(0);
}
function plantBed(level) {
    stopGarden();
    const generation = gardenGeneration;
    const field = el("garden-field");
    const row = beds[level];
    let amounts = row.map(() => 0);
    const flowers = [];
    let stage = "soil";
    let finished = false;
    let lastTick = 0;
    heading("fairy", "Puutarhan pikku apuri", "Muokkaa multa, kastele kukat ja siisti penkki.", "Kisukeijun puutarha");
    field.replaceChildren();
    field.dataset.stage = stage;
    const tool = document.createElement("span");
    tool.className = "garden-watering-can garden-tool";
    tool.setAttribute("aria-hidden", "true");
    tool.innerHTML =
        '<span class="garden-shovel"></span><img class="watering-icon" src="./assets/furniture/watering.webp" alt=""><span class="garden-drops"></span><span class="garden-brush"></span>';
    field.append(tool);
    row.forEach((x, index) => {
        const flower = button("", () => work(index, 25), "garden-flower");
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
        if (generation !== gardenGeneration || !field.isConnected)
            return;
        gardenView = createGardenView(field, flowers);
    }).catch(() => { });
    progress(0, row.length);
    feedback("Muokataan ensin multa lapiolla.");
    setAction("", null);
    function work(index, amount) {
        if (finished || amounts[index] >= 100)
            return;
        unlock();
        amounts[index] = Math.min(100, amounts[index] + amount);
        const flower = flowers[index];
        flower.style.setProperty("--growth", String(amounts[index] / 100));
        flower.style.setProperty("--garden-progress", amounts[index] + "%");
        flower.setAttribute("aria-label", `Kukkapenkki ${index + 1}, ${amounts[index]} prosenttia`);
        if (amounts[index] < 100)
            return;
        flower.classList.add(stage + "-done");
        ding("sprinkle");
        progress(amounts.filter((value) => value === 100).length, row.length);
        if (!amounts.every((value) => value === 100))
            return;
        if (stage === "soil") {
            stage = "water";
            feedback("Multa on valmis! Kastellaan kukat.");
        }
        else if (stage === "water") {
            stage = "tidy";
            feedback("Kukat kasvoivat! Siistitään lehdet.");
        }
        else {
            finished = true;
            feedback("Puutarha kukkii!");
            setAction(level + 1 < beds.length ? "Seuraava kukkapenkki" : "Juhlitaan!", () => {
                if (level + 1 < beds.length)
                    plantBed(level + 1);
                else {
                    stopGarden();
                    finish("Puutarha kukkii!", "Sait puutarhurin tarran!", "fairy");
                }
            });
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
    function move(from, to, force = false) {
        const bounds = field.getBoundingClientRect();
        tool.style.left = to.x - bounds.left + "px";
        tool.style.top = to.y - bounds.top + "px";
        const now = performance.now();
        if (!force && now - lastTick < 100)
            return;
        lastTick = now;
        flowers.forEach((flower, index) => {
            const rect = flower.getBoundingClientRect();
            const center = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            };
            if (distanceToStroke(center, from, to) <=
                Math.min(rect.width, rect.height) * 0.7)
                work(index, 25);
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
