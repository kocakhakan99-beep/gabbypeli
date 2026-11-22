import { el } from "../dom.js";
import { state } from "../state.js";
import { button, feedback, finish, heading, progress, setAction, } from "../ui.js";
import { ding, say, unlock } from "../audio.js";
const recipes = [2, 1, 3, 4];
let recipe = 0;
let served = 0;
let checked = false;
export function startBaking() {
    recipe = 0;
    showRecipe();
    playBakingDialogue();
}
export function playBakingDialogue() {
    say("Hei, pieni ystävä! Minä olen Gabby. Hile, mitä leivotaan tänään? Hei, Gabby! Leivotaan kaksi kuppikakkua. Yksi... kaksi. Haluatko auttaa? Leivotaan yhdessä.");
}
function showRecipe() {
    el("baking-dialogue").hidden = recipe !== 0;
    served = 0;
    checked = false;
    heading("cakey", "Leivotaan " + recipes[recipe] + " kuppikakkua!", "Kosketa taikinaa. Jokainen kosketus tekee yhden kakun.", "Hileen leipomo");
    el("baking-add").disabled = false;
    el("baking-check").disabled = false;
    el("baking-reset").disabled = false;
    setAction("", null);
    feedback("Hile odottaa herkkuja. Leivotaan yhdessä!");
    progress(recipe, recipes.length);
    drawPlate();
    say("Leivotaan " + recipes[recipe] + " kuppikakkua. Kosketa taikinaa.");
}
function drawPlate() {
    el("baking-target").textContent = String(recipes[recipe]);
    el("baking-count").textContent = String(served);
    el("baking-plate").replaceChildren();
    for (let i = 0; i < served; i++) {
        const cake = button("", () => {
            if (checked)
                return;
            served--;
            drawPlate();
            say("Nyt lautasella on " + served + " kuppikakkua.");
        }, "cake-on-plate");
        cake.innerHTML = '<span class="cupcake" aria-hidden="true"></span>';
        cake.setAttribute("aria-label", "Poista kuppikakku " + (i + 1));
        cake.disabled = checked;
        el("baking-plate").append(cake);
    }
}
export function addCake() {
    if (state.mode !== "baking" || checked)
        return;
    unlock();
    if (served === 6) {
        say("Lautanen on täynnä. Voit poistaa kakun koskettamalla sitä.");
        return;
    }
    served++;
    drawPlate();
    ding("sprinkle");
    say([
        "Ei vielä kakkuja.",
        "Yksi.",
        "Kaksi.",
        "Kolme.",
        "Neljä.",
        "Viisi.",
        "Kuusi.",
    ][served]);
}
export function resetPlate() {
    if (checked)
        return;
    served = 0;
    drawPlate();
    feedback("Lautanen on tyhjä. Kokeillaan yhdessä uudestaan.");
    say("Lautanen on tyhjä. Leivotaan uudestaan.");
}
export function checkRecipe() {
    if (checked)
        return;
    unlock();
    const target = recipes[recipe];
    if (served !== target) {
        feedback(served < target
            ? "Tarvitaan vielä lisää kakkuja."
            : "Nyt on vähän liikaa. Poista kakku koskettamalla sitä.");
        say(served < target
            ? "Tarvitaan vielä lisää kakkuja."
            : "Nyt on vähän liikaa. Kosketa kakkua, niin se poistuu.");
        return;
    }
    checked = true;
    drawPlate();
    el("baking-add").disabled = true;
    el("baking-check").disabled = true;
    el("baking-reset").disabled = true;
    progress(recipe + 1, recipes.length);
    feedback("Juuri sopivasti! Hile ilahtuu!");
    ding("celebration");
    say("Juuri sopivasti! Hile ilahtuu!");
    setAction(recipe === recipes.length - 1 ? "Juhlitaan!" : "Seuraava resepti", () => {
        recipe++;
        if (recipe === recipes.length)
            finish("Mikä ihana leipuri!", "Leivoit kaikki herkut. Hile kiittää avusta!", "cakey");
        else
            showRecipe();
    });
}
