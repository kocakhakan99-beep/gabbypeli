import { advanceAfterSuccess, button, feedback, finish, heading, picture, progress, setAction, } from "../ui.js";
import { ding, unlock } from "../audio.js";
import { el } from "../dom.js";
import { friends } from "../data.js";
import { shuffle } from "../utils.js";
import { state } from "../state.js";
const roomObjects = {
    gabby: [
        { id: "cupboard", name: "Kaappi" },
        { id: "box", name: "Lelulaatikko" },
        { id: "chair", name: "Tuoli" },
    ],
    cakey: [
        { id: "oven", name: "Uuni" },
        { id: "cupboard", name: "Keittiökaappi" },
        { id: "box", name: "Kakkulaatikko" },
    ],
    mercat: [
        { id: "tub", name: "Kylpyamme" },
        { id: "cupboard", name: "Kylpyhuoneen kaappi" },
        { id: "box", name: "Kori" },
    ],
    fairy: [
        { id: "tree", name: "Puu" },
        { id: "flowerpot", name: "Kukkaruukku" },
        { id: "box", name: "Puutarhalaatikko" },
    ],
    pandy: [
        { id: "box", name: "Lelulaatikko" },
        { id: "chair", name: "Nojatuoli" },
        { id: "tent", name: "Leikkiteltta" },
    ],
    dj: [
        { id: "piano", name: "Piano" },
        { id: "speaker", name: "Kaiutin" },
        { id: "cupboard", name: "Musiikkikaappi" },
    ],
};
export function renderFind() {
    const friend = friends[state.learnIndex];
    state.learnDone = false;
    heading(friend.id, "Kuka piilottelee?", "Kosketa huonekaluja. Kuka niiden takaa löytyy?", friend.room);
    const portrait = el("portrait");
    portrait.dataset.cast = "gabby";
    portrait.setAttribute("aria-label", "Gabby etsii piilottelevaa kaveria");
    el("pattern").hidden = true;
    const field = el("choices");
    field.replaceChildren();
    const room = document.createElement("div");
    room.className = "hide-room";
    room.dataset.room = friend.id;
    room.dataset.layout = String(state.learnIndex);
    room.setAttribute("role", "group");
    room.setAttribute("aria-label", "Tutki huoneen huonekaluja");
    field.append(room);
    feedback("");
    setAction("", null);
    progress(state.learnIndex, friends.length);
    const furniture = roomObjects[friend.id];
    const hidingPlace = Math.floor(Math.random() * furniture.length);
    shuffle(furniture).forEach((item, index) => {
        const isHiding = index === hidingPlace;
        const spot = button("", () => {
            if (state.learnDone || spot.classList.contains("opened"))
                return;
            unlock();
            spot.classList.add("opened");
            if (!isHiding) {
                spot.setAttribute("aria-label", item.name + " on tyhjä");
                feedback("Täällä ei vielä ollut ketään. Tutkitaan lisää!");
                return;
            }
            state.learnDone = true;
            spot.setAttribute("aria-label", "Löytyi " + friend.name);
            room.querySelectorAll("button").forEach((b) => {
                if (b !== spot)
                    b.disabled = true;
            });
            portrait.dataset.cast = friend.id;
            portrait.setAttribute("aria-label", friend.name);
            feedback("Löysit kaverin! " + friend.name + "!");
            ding("discovery");
            progress(state.learnIndex + 1, friends.length);
            setAction(state.learnIndex === friends.length - 1
                ? "Juhlitaan!"
                : "Seuraava kaveri", () => {
                state.learnIndex++;
                if (state.learnIndex === friends.length)
                    finish("Tarkat silmät!", "Löysit kaikki kuusi kaveria!", "gabby");
                else
                    renderFind();
            });
            advanceAfterSuccess();
        }, "hide-spot " + item.id);
        spot.style.setProperty("--spot-delay", `${index * 0.35}s`);
        spot.setAttribute("aria-label", "Tutki " + item.name.toLowerCase());
        spot.innerHTML =
            '<span class="hiding-friend">' +
                (isHiding ? picture(friend.id) : "") +
                '</span><span class="furniture" aria-hidden="true"><span></span></span>';
        room.append(spot);
    });
}
