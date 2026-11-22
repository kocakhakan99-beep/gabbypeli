import { playObjects } from "../play-objects.js";
import { button, cat, feedback, finish, heading, picture, progress, setAction, } from "../ui.js";
import { ding, say, unlock } from "../audio.js";
import { el } from "../dom.js";
import { friends } from "../data.js";
import { shuffle } from "../utils.js";
import { state } from "../state.js";
let pack = "friends";
export function initMemory() {
    heading("cakey", pack === "friends" ? "Etsi kaveriparit" : "Etsi esineparit", "Katso ensin kuvia. Piilota sitten kortit.", "Ystävien muistileikki");
    state.matched = 0;
    state.opened = [];
    state.waiting = false;
    state.preview = true;
    state.mem = shuffle((pack === "friends" ? friends : shuffle(playObjects))
        .slice(0, state.memoryPairs)
        .flatMap((f) => [
        { friend: f, found: false },
        { friend: f, found: false },
    ]));
    const packSettings = el("memory-packs");
    packSettings.replaceChildren();
    for (const [key, label] of [
        ["friends", "Kaverit"],
        ["objects", "Esineet"],
    ]) {
        const choice = button(label, () => {
            pack = key;
            initMemory();
        });
        choice.setAttribute("aria-pressed", String(pack === key));
        packSettings.append(choice);
    }
    el("memory-settings").replaceChildren();
    [2, 3, 4].forEach((n) => {
        const b = button(n + " paria", () => {
            state.memoryPairs = n;
            initMemory();
        });
        b.setAttribute("aria-pressed", String(n === state.memoryPairs));
        el("memory-settings").append(b);
    });
    drawCards();
    progress(0, state.memoryPairs);
    feedback("Katso kuvia. Piilota sitten kortit.");
    setAction("Piilota kortit", () => {
        state.preview = false;
        drawCards();
        setAction("", null);
        feedback("Käännä kaksi korttia.");
        el("instruction").textContent =
            "Käännä kaksi korttia. Etsi samanlaiset kuvat.";
        say(pack === "friends"
            ? "Käännä kaksi korttia. Missä on samanlainen kaveri?"
            : "Käännä kaksi korttia. Etsi samanlaiset esineet.");
    });
    if (pack === "friends")
        say("Katsotaan kaverit yhdessä. Kun olet valmis, paina Piilota kortit.");
    else
        say("Katso esineitä. Kun olet valmis, paina Piilota kortit.");
}
export function drawCards() {
    el("cards").className =
        "memory " +
            (state.memoryPairs === 2
                ? "four"
                : state.memoryPairs === 3
                    ? "six"
                    : "eight");
    el("cards").replaceChildren();
    state.mem.forEach((m, i) => {
        const up = state.preview || m.found || state.opened.includes(i);
        const b = button("", () => flip(i), "memory-card" + (m.found ? " matched" : up ? " faceup" : ""));
        b.innerHTML = picture(m.friend.id) + cat();
        b.setAttribute("aria-label", "Kortti " +
            (i + 1) +
            ": " +
            (up
                ? m.friend.name + (m.found ? ", pari löytyi" : "")
                : "kuvapuoli piilossa"));
        b.setAttribute("aria-pressed", String(up));
        b.disabled = m.found || state.preview;
        b.dataset.index = String(i);
        el("cards").append(b);
    });
}
export function flip(i) {
    if (state.preview ||
        state.waiting ||
        state.mem[i].found ||
        state.opened.includes(i))
        return;
    unlock();
    state.opened.push(i);
    drawCards();
    if (state.opened.length === 1) {
        if (pack === "friends")
            say(state.mem[i].friend.name + ". Etsi samanlainen kuva.");
        else {
            feedback("Etsi toinen samanlainen kuva.");
            say("Etsi toinen samanlainen kuva.");
        }
        return;
    }
    const [a, b] = state.opened;
    if (state.mem[a].friend.id === state.mem[b].friend.id) {
        state.mem[a].found = state.mem[b].found = true;
        state.matched++;
        state.opened = [];
        drawCards();
        progress(state.matched, state.memoryPairs);
        ding("pair");
        if (state.matched === state.memoryPairs) {
            feedback("Kaikki parit löytyivät!");
            setAction("Juhlitaan!", () => finish(pack === "friends"
                ? "Kaikki kaverit löytyivät!"
                : "Kaikki esineparit löytyivät!", "Gabby ja Pandi Pörrö taputtavat sinulle. Hienoa muistamista!", "gabby"));
            say("Kaikki parit löytyivät! Hienoa!");
        }
        else {
            feedback("Pari löytyi! Etsi seuraava.");
            say("Pari löytyi! Etsi seuraava.");
        }
    }
    else {
        state.waiting = true;
        feedback("Kaksi eri kuvaa. Katsotaan rauhassa.");
        setAction("Käännä takaisin", () => {
            state.opened = [];
            state.waiting = false;
            drawCards();
            setAction("", null);
            feedback("Kokeillaan uudestaan.");
            say("Kokeillaan uudestaan. Etsi samanlaiset kuvat.");
        });
        if (pack === "friends")
            say("Nämä ovat eri kaverit. Katso kuvia rauhassa. Käännetään sitten takaisin.");
    }
}
export function showMemoryHint() {
    if (state.matched === state.memoryPairs)
        return;
    state.preview = true;
    state.waiting = false;
    state.opened = [];
    drawCards();
    feedback("Katso kuvien paikat rauhassa.");
    say(pack === "friends"
        ? "Katsotaan kaverien paikat yhdessä."
        : "Katsotaan esineiden paikat yhdessä.");
    setAction("Piilota kortit", () => {
        state.preview = false;
        drawCards();
        feedback("Etsi taas samanlaiset kuvat.");
        setAction("", null);
        say(pack === "friends"
            ? "Etsi samanlaiset kaverit."
            : "Etsi samanlaiset esineet.");
    });
}
