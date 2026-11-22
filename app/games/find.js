import { advanceAfterSuccess } from "../ui.js";
import { button, feedback, finish, heading, picture, progress, setAction, } from "../ui.js";
import { ding, say, unlock } from "../audio.js";
import { el } from "../dom.js";
import { friends } from "../data.js";
import { shuffle } from "../utils.js";
import { state } from "../state.js";
export function renderFind() {
    const f = friends[state.learnIndex];
    const portrait = el("portrait");
    state.learnDone = false;
    heading(f.id, "Kuka piilottelee?", "Katso pientä kuvan osaa. Kenen kuva se on?", f.room);
    portrait.classList.add("find-clue");
    const tile = f.tile ?? state.learnIndex;
    portrait.style.setProperty("--clue-x", ((3 * (tile % 3) + 1) / 8) * 100 + "%");
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
