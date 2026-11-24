import { el } from "../dom.js";
import { ding, unlock } from "../audio.js";
import { feedback, finish, heading, progress } from "../ui.js";
import { bindStroke, stopStroke } from "./stroke.js";
const crops = {
    strawberry: { name: "Mansikka", phases: ["flower", "ripe", "post_harvest"], harvest: "Poimi mansikat" },
    sunflower: { name: "Auringonkukka", phases: ["bud", "bloom", "seed_head"], harvest: "Kerää siemenet" },
    carrot: { name: "Porkkana", phases: ["growing", "ripe", "harvested"], harvest: "Nosta porkkana" },
    magic_flower: { name: "Taikakukka", phases: ["bud", "bloom", "post_harvest"], harvest: "Kerää taikaterälehti" },
};
export const cropLevels = [
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
export function openCropGarden(field, adventureOrder) {
    let order = adventureOrder;
    let alive = true;
    let view;
    let plot;
    let tool;
    let basket;
    let bedIndex = 0;
    const orderList = document.querySelector("#gf-garden-order");
    function releaseBed() {
        if (plot)
            stopStroke(plot);
        if (tool)
            stopStroke(tool);
        if (basket)
            basket.remove();
        basket = undefined;
        plot = tool = undefined;
        view?.destroy();
        view = undefined;
        field.replaceChildren();
    }
    function showOrder(harvested) {
        if (!order)
            return;
        orderList.replaceChildren(...order.map((id, index) => {
            const item = document.createElement("li");
            const complete = index < bedIndex || (harvested && index === bedIndex);
            item.textContent = crops[id].name;
            if (complete)
                item.setAttribute("aria-label", crops[id].name + ", korjattu");
            if (index === bedIndex && !harvested)
                item.setAttribute("aria-current", "step");
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
    if (order)
        showOrder(false);
    else {
        const settings = document.createElement("fieldset");
        settings.className = "sandbox-game-options garden-crop-choices";
        settings.innerHTML = `<legend>Kasvatuksen asetukset</legend>
      <label>Kasvupaikkoja <select><option>1</option><option>2</option><option>3</option></select></label>
      <div class="garden-extra-crops"></div>
      <p>Valitse ensimmäinen kasvi ja aloita.</p>`;
        field.append(settings);
        const quantity = settings.querySelector("select");
        const extra = settings.querySelector(".garden-extra-crops");
        const ids = Object.keys(crops);
        const additional = [2, 3].map((position) => {
            const label = document.createElement("label");
            label.hidden = true;
            label.textContent = `Kasvi ${position}`;
            const select = document.createElement("select");
            for (const id of ids)
                select.add(new Option(crops[id].name, id));
            select.value = ids[position - 1];
            label.append(select);
            extra.append(label);
            return select;
        });
        quantity.onchange = () => {
            additional.forEach((select, index) => { select.parentElement.hidden = Number(quantity.value) < index + 2; });
        };
        for (const id of ids) {
            const choice = document.createElement("button");
            choice.type = "button";
            choice.textContent = crops[id].name;
            choice.onclick = () => {
                const count = Number(quantity.value);
                if (count > 1) {
                    order = [id, ...additional.slice(0, count - 1).map((select) => select.value)];
                    orderList.hidden = false;
                    showOrder(false);
                }
                start(id);
            };
            settings.append(choice);
        }
    }
    function start(id) {
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
        let dragStart;
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
        function render() {
            const instruction = instructions[phase];
            target.dataset.soil = phase === 0 ? "dry" : phase === 1 ? "dug" : phase === 2 ? "sown" : "wet";
            target.textContent = states[phase];
            target.setAttribute("aria-label", instruction ? instruction + " · " + states[phase] : states[phase]);
            field.dataset.cropPhase = String(phase);
            field.dataset.cropFrame = frames[phase - 1] || "";
            if (phase === 0)
                field.dataset.cropFrame = "";
            view?.setFrame(field.dataset.cropFrame);
            if (order)
                progress(bedIndex + Number(phase === instructions.length), order.length);
            else
                progress(phase, instructions.length);
            if (instruction) {
                el("instruction").textContent = phase === 4 ? "Vedä rikkaruoho sivuun."
                    : phase === 6 ? instruction + " vetämällä kasvista."
                        : watering() ? "Vedä kannu kasvin päälle ja kallista kastellaksesi."
                            : instruction + " vetämällä esine kasvupaikalle.";
                icon.className = phase === 1 ? "garden-seed" : toolArt[phase];
                icon.style.backgroundImage = phase === 1
                    ? `url("./assets/nabby-garden-v6/${id}/seed.webp")` : "";
                action.setAttribute("aria-label", instruction);
                label.textContent = instruction;
                target.dataset.work = phase === 4 ? "weed" : phase === 6 ? "harvest" : "";
                action.hidden = phase === 4 || phase === 6;
                if (action.hidden)
                    target.focus({ preventScroll: true });
                else if (document.activeElement === target)
                    action.focus({ preventScroll: true });
            }
        }
        function advance() {
            if (phase >= instructions.length)
                return;
            unlock();
            ding("sprinkle");
            phase++;
            misses = 0;
            feedback("");
            target.classList.remove("garden-crop-hint");
            render();
            if (phase < instructions.length)
                return;
            action.hidden = true;
            target.setAttribute("aria-disabled", "true");
            el("instruction").textContent = crop.name + " on korjattu.";
            showOrder(true);
            const next = order?.[bedIndex + 1];
            basket = document.createElement("div");
            basket.className = "garden-harvest-basket";
            basket.textContent = "Satokori";
            field.append(basket);
            target.setAttribute("aria-label", "Siirrä sato koriin");
            target.removeAttribute("aria-disabled");
            target.dataset.work = "basket";
            el("instruction").textContent = "Vedä valmis sato satokoriin.";
            target.focus({ preventScroll: true });
            function deliver() {
                releaseBed();
                if (next) {
                    bedIndex++;
                    showOrder(false);
                    start(next);
                }
                else {
                    finish("Sato on valmis!", bedIndex ? "Korjasit kaikki tason sadot!" : crop.name + " kasvoi hienosti.", "fairy");
                }
            }
            target.onclick = (event) => { if (event.detail === 0)
                deliver(); };
            bindStroke(target, {
                start(point) { dragStart = point; },
                move(_previous, point) {
                    art.style.translate = `${point.x - dragStart.x}px ${point.y - dragStart.y}px`;
                },
                end(point) {
                    art.style.removeProperty("translate");
                    if (!point || Math.hypot(point.x - dragStart.x, point.y - dragStart.y) < 16 || !basket)
                        return;
                    const bounds = basket.getBoundingClientRect();
                    if (point.x >= bounds.left && point.x <= bounds.right &&
                        point.y >= bounds.top && point.y <= bounds.bottom)
                        deliver();
                    else
                        feedback("Vie sato satokoriin.");
                },
            });
        }
        action.onclick = (event) => { if (!action.hidden && event.detail === 0)
            advance(); };
        target.onclick = (event) => { if (action.hidden && event.detail === 0)
            advance(); };
        bindStroke(action, {
            start(point) {
                dragStart = point;
            },
            move(_previous, point) {
                const rect = target.getBoundingClientRect();
                const overPlot = point.x >= rect.left && point.x <= rect.right &&
                    point.y >= rect.top && point.y <= rect.bottom;
                field.classList.toggle("garden-crop-watering", watering() && overPlot);
                action.style.rotate = watering() && overPlot ? "-30deg" : "";
                action.style.translate = `${point.x - dragStart.x}px ${point.y - dragStart.y}px`;
            },
            end(point) {
                field.classList.remove("garden-crop-watering");
                action.style.removeProperty("translate");
                action.style.removeProperty("rotate");
                if (!point || Math.hypot(point.x - dragStart.x, point.y - dragStart.y) < 12)
                    return;
                const rect = art.getBoundingClientRect();
                if (point.x >= rect.left && point.x <= rect.right &&
                    point.y >= rect.top && point.y <= target.getBoundingClientRect().bottom)
                    advance();
                else {
                    feedback("Kokeile kasvupaikkaa.");
                    if (++misses >= 2)
                        target.classList.add("garden-crop-hint");
                }
            },
        });
        bindStroke(target, {
            start(point) { dragStart = point; },
            move(_previous, point) {
                if (phase === 4)
                    target.style.setProperty("--weed-offset", `${point.x - dragStart.x}px`);
                if (phase === 6)
                    art.style.translate = `0 ${Math.min(0, point.y - dragStart.y)}px`;
            },
            end(point) {
                art.style.removeProperty("translate");
                target.style.removeProperty("--weed-offset");
                if (!point)
                    return;
                if ((phase === 4 && Math.abs(point.x - dragStart.x) > 24) ||
                    (phase === 6 && dragStart.y - point.y > 24))
                    advance();
            },
        });
        render();
        action.focus({ preventScroll: true });
        void import("../phaser-room.js").then(({ createCropView }) => {
            if (!alive || !art.isConnected)
                return;
            view = createCropView(art, id, field.dataset.cropFrame ?? "");
        }).catch(() => { });
    }
    if (adventureOrder)
        start(adventureOrder[0]);
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
