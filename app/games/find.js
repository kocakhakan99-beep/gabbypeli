import { advanceAfterSuccess } from "../ui.js";
import { button, feedback, finish, heading, picture, progress, setAction, } from "../ui.js";
import { ding, say, unlock } from "../audio.js";
import { el } from "../dom.js";
import { friends } from "../data.js";
import { shuffle } from "../utils.js";
import { state } from "../state.js";
import { bindStroke, stopStroke } from "./stroke.js";
export function renderFind() {
    const f = friends[state.learnIndex];
    const portrait = el("portrait");
    stopStroke(portrait);
    state.learnDone = false;
    heading(f.id, "Kuka piilottelee?", "Katso pientä kuvan osaa. Kenen kuva se on?", f.room);
    portrait.classList.add("find-clue");
    portrait.setAttribute("aria-label", "Tutki piilossa olevaa kaveria liikuttamalla sormea kuvan päällä");
    let clueScale = 3;
    const tile = f.tile ?? state.learnIndex;
    portrait.style.setProperty("--clue-x", ((3 * (tile % 3) + 1) / 8) * 100 + "%");
    function revealMore() {
        if (state.learnDone || clueScale <= 1.5)
            return;
        clueScale = Math.max(1.5, clueScale - 0.5);
        const x = tile % 3;
        const y = Math.floor(tile / 3);
        portrait.style.backgroundSize = `${3 * clueScale * 100}% ${2 * clueScale * 100}%`;
        portrait.style.backgroundPosition = `${((clueScale * x + (clueScale - 1) / 2) / (3 * clueScale - 1)) * 100}% ${((clueScale * y + (clueScale - 1) / 2) / (2 * clueScale - 1)) * 100}%`;
    }
    let travelled = 0;
    bindStroke(portrait, {
        start() {
            travelled = 0;
        },
        move(from, to) {
            travelled += Math.hypot(to.x - from.x, to.y - from.y);
            if (travelled >= 40) {
                travelled = 0;
                revealMore();
            }
        },
        end() { },
    });
    portrait.style.setProperty("--clue-y", ((3 * Math.floor(tile / 3) + 1) / 5) * 100 + "%");
    el("pattern").hidden = true;
    el("choices").replaceChildren();
    feedback("");
    setAction("", null);
    progress(state.learnIndex, friends.length);
    const choices = shuffle([
        f,
        ...shuffle(friends.filter((friend) => friend.id !== f.id)).slice(0, 2),
    ]);
    choices.forEach((friend) => {
        const b = button("", () => {
            if (state.learnDone || b.disabled)
                return;
            unlock();
            if (friend.id === f.id) {
                state.learnDone = true;
                stopStroke(portrait);
                b.classList.add("correct");
                portrait.classList.remove("find-clue");
                portrait.classList.add("find-reveal");
                portrait.style.removeProperty("--clue-x");
                portrait.style.removeProperty("--clue-y");
                portrait.style.backgroundSize = "300% 200%";
                el("choices")
                    .querySelectorAll("button")
                    .forEach((x) => (x.disabled = true));
                feedback("Löysit oikean kaverin! " + f.name + "!");
                ding("discovery");
                say("Löysit oikean kaverin! " + f.name);
                el("portrait").style.backgroundSize = "";
                el("portrait").style.backgroundPosition = "";
                progress(state.learnIndex + 1, friends.length);
                setAction(state.learnIndex === friends.length - 1
                    ? "Juhlitaan!"
                    : "Seuraava kaveri", () => {
                    state.learnIndex++;
                    if (state.learnIndex === friends.length)
                        finish("Tarkat silmät!", "Löysit kaikki kuusi kaveria. Gabby on iloinen avustasi!", "gabby");
                    else
                        renderFind();
                });
                advanceAfterSuccess();
            }
            else {
                b.disabled = true;
                revealMore();
                feedback("Tutkitaan vielä. Katso värejä ja korvia.");
                say("Tutkitaan vielä. Katso kuvan värejä ja korvia.");
            }
        }, "choice");
        b.innerHTML =
            '<span class="mini">' +
                picture(friend.id) +
                "</span><span>" +
                friend.name +
                "</span>";
        b.setAttribute("aria-label", friend.name);
        el("choices").append(b);
    });
    say("Kuka piilottelee? Katso kuvan osaa ja kosketa oikeaa kaveria.");
}
