import { advanceAfterSuccess } from "../ui.js";
import { el } from "../dom.js";
import { button, heading, progress, feedback, finish, setAction, } from "../ui.js";
import { say, ding, unlock } from "../audio.js";
import { bindStroke, distanceToStroke } from "./stroke.js";
const beds = [
    [24, 49, 76],
    [17, 37, 60, 82],
];
const flowerColors = ["#ff88bc", "#ffd778", "#ba96ff", "#ffa6c9"];
export function startGarden() {
    plantBed(0);
}
function plantBed(level) {
    const field = el("garden-field");
    heading("fairy", "Auta kukat kasvamaan", "Liu’uta sormea nuppujen yli tai kosketa niitä.", "Kisukeijun puutarha");
    field.replaceChildren();
    const wateringCan = document.createElement("span");
    wateringCan.className = "garden-watering-can";
    wateringCan.setAttribute("aria-hidden", "true");
    wateringCan.innerHTML =
        '<img class="watering-icon" src="./assets/furniture/watering.webp" alt="" draggable="false"><span class="garden-drops"></span>';
    field.append(wateringCan);
    const row = beds[level];
    const grown = new Set();
    const flowers = [];
    progress(0, row.length);
    feedback("");
    setAction("", null);
    say("Liu'uta sormea nuppujen yli. Katsotaan, miten kukat aukeavat!");
    function bloom(index) {
        if (grown.has(index))
            return;
        unlock();
        grown.add(index);
        flowers[index].classList.add("bloomed");
        flowers[index].setAttribute("aria-disabled", "true");
        flowers[index].setAttribute("aria-label", "Avautunut kukka " + (index + 1));
        const butterfly = document.createElement("span");
        butterfly.className = "garden-butterfly";
        butterfly.setAttribute("aria-hidden", "true");
        butterfly.style.setProperty("--butterfly-x", row[index] + "%");
        butterfly.style.setProperty("--butterfly-y", (index % 2 ? 28 : 38) + "%");
        butterfly.style.setProperty("--butterfly-color", flowerColors[(index + 1) % flowerColors.length]);
        butterfly.innerHTML = "<span></span><span></span>";
        field.append(butterfly);
        progress(grown.size, row.length);
        ding("sprinkle");
        if (grown.size !== row.length)
            return;
        feedback("Kaikki kukat aukesivat!");
        say("Kaikki kukat aukesivat!");
        setAction(level + 1 < beds.length ? "Seuraava kukkapenkki" : "Juhlitaan!", () => {
            if (level + 1 < beds.length)
                plantBed(level + 1);
            else
                finish("Puutarha kukkii!", "Sait puutarhurin tarran!", "fairy");
        });
        advanceAfterSuccess();
    }
    row.forEach((x, index) => {
        const flower = button("", () => bloom(index), "garden-flower");
        flower.setAttribute("aria-label", "Avaa nuppu " + (index + 1));
        flower.style.setProperty("--flower-x", x + "%");
        flower.style.setProperty("--flower-y", (index % 2 ? 48 : 58) + "%");
        flower.style.setProperty("--petal", flowerColors[index]);
        flower.innerHTML =
            '<span class="garden-stem"></span><span class="garden-bud"></span><span class="garden-petals"></span>';
        flowers.push(flower);
        field.append(flower);
    });
    function water(from, to) {
        const bounds = field.getBoundingClientRect();
        wateringCan.style.left = to.x - bounds.left + "px";
        wateringCan.style.top = to.y - bounds.top + "px";
        flowers.forEach((flower, index) => {
            if (grown.has(index))
                return;
            const rect = flower.getBoundingClientRect();
            const center = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            };
            if (distanceToStroke(center, from, to) <=
                Math.min(rect.height, rect.width) / 2)
                bloom(index);
        });
    }
    bindStroke(field, {
        start(point) {
            unlock();
            field.classList.add("watering");
            water(point, point);
        },
        move: water,
        end() {
            field.classList.remove("watering");
        },
    });
}
