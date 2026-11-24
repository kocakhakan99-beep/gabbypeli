import { bindStroke, stopStroke, type Point } from "./stroke.js";
import { campaignLevel } from "../campaign.js";
import {
  advanceAfterSuccess,
  button,
  feedback,
  finish,
  heading,
  picture,
  progress,
  setAction,
} from "../ui.js";
import { ding, unlock } from "../audio.js";
import { el } from "../dom.js";
import { friends } from "../data.js";
import { shuffle } from "../utils.js";
import { state } from "../state.js";
import type { RoomView } from "../phaser-room.js";

let roomView: RoomView | undefined;
let roomGeneration = 0;

export function stopFind(): void {
  el("choices").querySelectorAll<HTMLElement>(".hide-spot, .find-next-door").forEach(stopStroke);
  roomGeneration++;
  roomView?.destroy();
  roomView = undefined;
}

const roomObjects: Record<string, { id: string; name: string }[]> = {
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

const hideFrames: Readonly<Record<string, string>> = {
  cupboard: "cabinet_closed_example",
  chair: "chair_closed_example",
  box: "gift_closed",
  basket: "basket_plain",
};

const roomSurprises: Record<string, { id: string; name: string }> = {
  gabby: { id: "star", name: "tähtityyny" },
  cakey: { id: "cupcakes", name: "kuppikakkuja" },
  mercat: { id: "shell", name: "simpukka" },
  fairy: { id: "watering", name: "kastelukannu" },
  pandy: { id: "yarn", name: "lankakerä" },
  dj: { id: "train", name: "lelujuna" },
};

let freeRooms = friends.length;
let freeSpots = 4;
let freeStart = 0;

export function startFind(): void {
  freeRooms = friends.length;
  freeSpots = 4;
  freeStart = 0;
  renderFind();
}

function renderFind(): void {
  stopFind();
  const generation = roomGeneration;
  const level = campaignLevel();
  const roomCount = level === undefined ? freeRooms : Math.min(friends.length, 1 + Math.floor(level / 2));
  const offset = level === undefined ? freeStart : (level - 1) % friends.length;
  const friend = friends[(offset + state.learnIndex) % friends.length];
  state.learnDone = false;
  heading(
    friend.id,
    "Kuka piilottelee?",
    "Siirrä huonekalu sivuun. Kuka sen takaa löytyy?",
    friend.room,
  );
  const portrait = el("portrait");
  portrait.dataset.cast = "gabby";
  portrait.setAttribute("aria-label", "Gabby etsii piilottelevaa kaveria");
  el("pattern").hidden = true;
  const field = el("choices");
  field.replaceChildren();
  if (level === undefined && state.learnIndex === 0) {
    const settings = document.createElement("details");
    settings.className = "find-settings sandbox-game-options";
    settings.innerHTML = `<summary>Piilopelin asetukset</summary>
      <label>Aloitushuone <select id="gf-find-start">${friends.map(({room}, index) =>
        `<option value="${index}">${room}</option>`).join("")}</select></label>
      <label>Huoneita <select id="gf-find-rooms">${friends.map((_, index) =>
        `<option>${index + 1}</option>`).join("")}</select></label>
      <label>Piilopaikkoja <select id="gf-find-spots"><option>2</option><option>3</option><option>4</option></select></label>
      <button type="button">Uusi piiloleikki</button>`;
    const start = settings.querySelector<HTMLSelectElement>("#gf-find-start")!;
    const count = settings.querySelector<HTMLSelectElement>("#gf-find-rooms")!;
    const spots = settings.querySelector<HTMLSelectElement>("#gf-find-spots")!;
    start.value = String(freeStart);
    count.value = String(freeRooms);
    spots.value = String(freeSpots);
    settings.querySelector("button")!.onclick = () => {
      freeStart = Number(start.value);
      freeRooms = Number(count.value);
      freeSpots = Number(spots.value);
      renderFind();
    };
    field.append(settings);
  }
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
  const furniture = shuffle(roomObjects[friend.id]).slice(0, level === undefined ? freeSpots : level <= 2 ? 2 : level <= 5 ? 3 : 4);
  const surprise = roomSurprises[friend.id];
  const hidingPlace = Math.floor(Math.random() * furniture.length);
  const roomItems = shuffle(furniture).map((item, index) => ({
    id: item.id,
    hidden: index === hidingPlace,
    frame: hideFrames[item.id],
  }));
  roomItems.forEach((roomItem, index) => {
    const item = furniture.find((object) => object.id === roomItem.id)!;
    const isHiding = index === hidingPlace;
    let origin: Point | undefined;
    const spot = button(
      "",
      () => {
        if (state.learnDone || spot.classList.contains("opened")) return;
        unlock();
        spot.classList.add("opened");
        roomView?.reveal(index);
        if (!isHiding) {
          spot.setAttribute(
            "aria-label",
            item.name + ": löytyi " + surprise.name,
          );
          feedback("Löytyi " + surprise.name + "! Missähän kaveri on?");
          ding("sprinkle");
          return;
        }
        state.learnDone = true;
        spot.setAttribute("aria-label", "Löytyi " + friend.name);
        room.querySelectorAll<HTMLButtonElement>("button").forEach((b) => {
          if (b !== spot) b.disabled = true;
        });
        portrait.dataset.cast = friend.id;
        portrait.setAttribute("aria-label", friend.name);
        feedback("Löysit kaverin! " + friend.name + "!");
        ding("discovery");
        progress(state.learnIndex + 1, roomCount);
        if (state.learnIndex === roomCount - 1) {
          setAction("", () => {
            stopFind();
            finish("Tarkat silmät!", "Löysit kaikki tämän leikin kaverit!", "gabby");
          });
          advanceAfterSuccess(1000);
          return;
        }
        el("instruction").textContent = "Vedä ovi sivuun ja jatka seuraavaan huoneeseen.";
        const door = document.createElement("button");
        door.type = "button";
        door.className = "find-next-door";
        door.setAttribute("aria-label", "Avaa seuraavan huoneen ovi");
        door.innerHTML = '<img src="./assets/gabby/home/door_main.webp" alt="" draggable="false">';
        function nextRoom(): void {
          state.learnIndex++;
          renderFind();
          el("choices").querySelector<HTMLElement>(".hide-spot")?.focus({ preventScroll: true });
        }
        door.onclick = (event) => { if (event.detail === 0) nextRoom(); };
        let start: Point;
        bindStroke(door, {
          start(point) { start = point; },
          move(_previous, point) {
            door.style.setProperty("--door-travel", `${Math.min(65, Math.abs(point.x - start.x))}px`);
          },
          end(point) {
            door.style.removeProperty("--door-travel");
            if (point && Math.abs(point.x - start.x) >= 28) nextRoom();
          },
        });
        field.append(door);
        door.focus({ preventScroll: true });
      },
      "hide-spot " + item.id,
    );
    spot.addEventListener("click", (event) => {
      if (event.detail > 0) event.stopImmediatePropagation();
    }, { capture: true });
    spot.style.setProperty("--spot-delay", `${index * 0.35}s`);
    spot.setAttribute("aria-label", "Tutki " + item.name.toLowerCase());
    bindStroke(spot, {
      start(point) {
        if (!spot.disabled && !spot.classList.contains("opened")) origin = point;
      },
      move(_previous, point) {
        if (!origin) return;
        const distance = Math.hypot(point.x - origin.x, point.y - origin.y);
        const amount = Math.min(1, distance / Math.max(48, spot.clientWidth * 0.35));
        roomView?.drag(index, amount);
        spot.style.setProperty("--hide-drag", String(amount));
        spot.classList.add("moving");
      },
      end(point) {
        const start = origin;
        origin = undefined;
        spot.classList.remove("moving");
        spot.style.removeProperty("--hide-drag");
        if (!start) return;
        if (point && Math.hypot(point.x - start.x, point.y - start.y) >= Math.max(28, spot.clientWidth * 0.2)) {
          spot.click();
        } else {
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
      if (generation !== roomGeneration || !room.isConnected) return;
      roomView = createRoomView(canvas, roomItems, friend.id, surprise.id);
      room.querySelectorAll<HTMLButtonElement>(".hide-spot").forEach((spot, index) => {
        if (spot.classList.contains("opened")) roomView?.reveal(index);
      });
    }).catch(() => {
      canvas.remove();
    });
  }
}
