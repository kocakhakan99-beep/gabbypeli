import { bindStroke } from "./stroke.js";
import { campaignLevel } from "../campaign.js";
import { advanceAfterSuccess, button, feedback, finish, heading, picture, progress, setAction, } from "../ui.js";
import { ding, unlock } from "../audio.js";
import { el } from "../dom.js";
import { friends } from "../data.js";
import { shuffle } from "../utils.js";
import { state } from "../state.js";
let roomView;
let roomGeneration = 0;
export function stopFind() {
    roomGeneration++;
    roomView?.destroy();
    roomView = undefined;
}
const roomObjects = {
    gabby: [
        { id: "cupboard", name: "Kaappi" },
        { id: "box", name: "Lelulaatikko" },
        { id: "chair", name: "Tuoli" },
        { id: "tent", name: "Leikkiteltta" },
    ],
    cakey: [
        { id: "basket", name: "Kori" },
        { id: "cupboard", name: "Keittiökaappi" },
        { id: "box", name: "Kakkulaatikko" },
        { id: "chair", name: "Keittiötuoli" },
    ],
    mercat: [
        { id: "tub", name: "Kylpyamme" },
        { id: "cupboard", name: "Kylpyhuoneen kaappi" },
        { id: "box", name: "Kori" },
        { id: "chair", name: "Jakkara" },
    ],
    fairy: [
        { id: "tree", name: "Puu" },
        { id: "flowerpot", name: "Kukkaruukku" },
        { id: "box", name: "Puutarhalaatikko" },
        { id: "chair", name: "Puutarhatuoli" },
    ],
    pandy: [
        { id: "box", name: "Lelulaatikko" },
        { id: "chair", name: "Nojatuoli" },
        { id: "tent", name: "Leikkiteltta" },
        { id: "cupboard", name: "Lelukaappi" },
    ],
    dj: [
        { id: "piano", name: "Piano" },
        { id: "speaker", name: "Kaiutin" },
        { id: "cupboard", name: "Musiikkikaappi" },
        { id: "chair", name: "Musiikkituoli" },
    ],
};
const hideFrames = {
    cupboard: "cabinet_closed_example",
    chair: "chair_closed_example",
    box: "gift_closed",
    basket: "basket_plain",
};
const roomSurprises = {
    gabby: { id: "star", name: "tähtityyny" },
    cakey: { id: "cupcakes", name: "kuppikakkuja" },
    mercat: { id: "shell", name: "simpukka" },
    fairy: { id: "watering", name: "kastelukannu" },
    pandy: { id: "yarn", name: "lankakerä" },
    dj: { id: "train", name: "lelujuna" },
};
export function renderFind() {
    stopFind();
    const generation = roomGeneration;
    const level = campaignLevel();
    const roomCount = level === undefined ? friends.length : Math.min(friends.length, 1 + Math.floor(level / 2));
    const offset = level === undefined ? 0 : (level - 1) % friends.length;
    const friend = friends[(offset + state.learnIndex) % friends.length];
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
    progress(state.learnIndex, roomCount);
    const furniture = shuffle(roomObjects[friend.id]).slice(0, level === undefined ? 4 : level <= 2 ? 2 : level <= 5 ? 3 : 4);
    const surprise = roomSurprises[friend.id];
    const hidingPlace = Math.floor(Math.random() * furniture.length);
    const roomItems = shuffle(furniture).map((item, index) => ({
        id: item.id,
        hidden: index === hidingPlace,
        frame: hideFrames[item.id],
    }));
    roomItems.forEach((roomItem, index) => {
        const item = furniture.find((object) => object.id === roomItem.id);
        const isHiding = index === hidingPlace;
        let origin;
        let suppressClick = false;
        const spot = button("", () => {
            if (suppressClick) {
                suppressClick = false;
                return;
            }
            if (state.learnDone || spot.classList.contains("opened"))
                return;
            unlock();
            spot.classList.add("opened");
            roomView?.reveal(index);
            if (!isHiding) {
                spot.setAttribute("aria-label", item.name + ": löytyi " + surprise.name);
                feedback("Löytyi " + surprise.name + "! Missähän kaveri on?");
                ding("sprinkle");
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
            progress(state.learnIndex + 1, roomCount);
            setAction(state.learnIndex === roomCount - 1
                ? "Juhlitaan!"
                : "Seuraava kaveri", () => {
                state.learnIndex++;
                if (state.learnIndex === roomCount) {
                    stopFind();
                    finish("Tarkat silmät!", "Löysit kaikki tämän leikin kaverit!", "gabby");
                }
                else
                    renderFind();
            });
            advanceAfterSuccess();
        }, "hide-spot " + item.id);
        spot.style.setProperty("--spot-delay", `${index * 0.35}s`);
        spot.setAttribute("aria-label", "Tutki " + item.name.toLowerCase());
        bindStroke(spot, {
            start(point) {
                if (!spot.disabled && !spot.classList.contains("opened"))
                    origin = point;
            },
            move(_previous, point) {
                if (!origin)
                    return;
                const distance = Math.hypot(point.x - origin.x, point.y - origin.y);
                roomView?.drag(index, distance / Math.max(48, spot.clientWidth * 0.35));
            },
            end(point) {
                const start = origin;
                origin = undefined;
                if (!start)
                    return;
                if (point && Math.hypot(point.x - start.x, point.y - start.y) >= Math.max(28, spot.clientWidth * 0.2)) {
                    spot.click();
                    suppressClick = true;
                    window.setTimeout(() => { suppressClick = false; }, 0);
                }
                else {
                    roomView?.drag(index, 0);
                }
            },
        });
        spot.innerHTML =
            '<span class="hiding-friend">' +
                picture(isHiding ? friend.id : surprise.id) +
                '</span><img class="furniture-image" src="' +
                (roomItem.frame ? `./assets/gabby/hide/${roomItem.frame}.webp` : `./assets/furniture/${item.id}.webp`) +
                '" alt="" draggable="false">';
        room.append(spot);
    });
    {
        const canvas = document.createElement("div");
        canvas.className = "phaser-room-canvas";
        canvas.setAttribute("aria-hidden", "true");
        room.append(canvas);
        void import("../phaser-room.js").then(({ createRoomView }) => {
            if (generation !== roomGeneration || !room.isConnected)
                return;
            roomView = createRoomView(canvas, roomItems, friend.id, surprise.id);
            room.querySelectorAll(".hide-spot").forEach((spot, index) => {
                if (spot.classList.contains("opened"))
                    roomView?.reveal(index);
            });
        }).catch(() => {
            canvas.remove();
        });
    }
}
