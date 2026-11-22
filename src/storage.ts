import type { GameMode, Preferences, SavedProgress } from "./types.js";

const key = "gabbypeli-progress-v1";
const stickerSets = [
  {
    mode: "memory",
    label: "Kaverit",
    art: "gabby",
    bonus: "Tassukortit",
    tile: 0,
  },
  {
    mode: "puzzle",
    label: "Taikakuva",
    art: "fairy",
    bonus: "Sydänpala",
    tile: 1,
  },
  {
    mode: "learn",
    label: "Pikku apuri",
    art: "mercat",
    bonus: "Sydänovinen nukketalo",
    tile: 4,
  },
  {
    mode: "find",
    label: "Tarkat silmät",
    art: "gabby",
    bonus: "Taikaluuppi",
    tile: 2,
  },
  {
    mode: "sizes",
    label: "Vertailija",
    art: "fairy",
    bonus: "Pallokaverit",
    tile: 3,
  },
  {
    mode: "baking",
    label: "Pikku leipuri",
    art: "cakey",
    bonus: "Hileen kuppikakku",
    tile: 5,
  },
  {
    mode: "bubbles",
    label: "Kuplataikuri",
    art: "mercat",
    bonus: "Merikatin taikakupla",
    tile: 6,
  },
  {
    mode: "drawing",
    label: "Taiteilija",
    art: "gabby",
    bonus: "Sateenkaarikynä",
    tile: 7,
  },
  {
    mode: "garden",
    label: "Puutarhuri",
    art: "fairy",
    bonus: "Kisukeijun kastelukannu",
    tile: 8,
  },
] as const;
type StickerSet = (typeof stickerSets)[number];

const defaults: Preferences = {
  speech: true,
  effects: true,
  volume: 0.65,
};

export function readProgress(): SavedProgress {
  const fallback: SavedProgress = {
    version: 1,
    completed: {},
    preferences: { ...defaults },
  };
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (!saved || typeof saved !== "object") return fallback;
    const data = saved as Partial<SavedProgress>;
    if (data.version !== 1) return fallback;
    for (const { mode } of stickerSets) {
      const value = data.completed?.[mode];
      if (
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value > 0
      ) {
        fallback.completed[mode] = Math.min(value, 9999);
      }
    }
    const preferences = data.preferences;
    if (preferences) {
      fallback.preferences.speech =
        typeof preferences.speech === "boolean" ? preferences.speech : true;
      fallback.preferences.effects =
        typeof preferences.effects === "boolean" ? preferences.effects : true;
      fallback.preferences.volume =
        typeof preferences.volume === "number" &&
        Number.isFinite(preferences.volume)
          ? Math.max(0, Math.min(1, preferences.volume))
          : defaults.volume;
    }
  } catch {
    /* Storage may be disabled or contain an older, unreadable value. */
  }
  return fallback;
}

export const savedProgress = readProgress();

export function saveProgress(): void {
  try {
    localStorage.setItem(key, JSON.stringify(savedProgress));
  } catch {
    /* Play continues when the browser cannot save progress. */
  }
}

export function completeGame(mode: GameMode): void {
  const count = Math.min((savedProgress.completed[mode] ?? 0) + 1, 9999);
  savedProgress.completed[mode] = count;
  saveProgress();
  renderStickers();

  const reward = document.getElementById("gf-sticker-reward");
  if (!reward) return;
  const set = stickerSets.find((entry) => entry.mode === mode);
  reward.replaceChildren();
  reward.hidden = !set || count > 2;
  if (set && count <= 2) {
    const title = document.createElement("strong");
    title.textContent = "Sait uuden tarran!";
    reward.append(title, sticker(set, count === 2, true));
  }
}

function sticker(
  set: StickerSet,
  bonus: boolean,
  earned: boolean,
): HTMLElement {
  const label = bonus ? set.bonus : set.label;
  const item = document.createElement("div");
  item.className = "sticker" + (earned ? " earned" : "");
  item.setAttribute(
    "aria-label",
    label +
      (earned
        ? ", ansaittu"
        : bonus
          ? ", saat pelaamalla leikin loppuun kahdesti"
          : ", odottaa leikkiä"),
  );
  const image = document.createElement("span");
  image.className = "picture";
  image.setAttribute("aria-hidden", "true");
  if (bonus) {
    image.classList.add("bonus-art");
    image.style.setProperty("--sticker-x", (set.tile % 3) * 50 + "%");
    image.style.setProperty("--sticker-y", Math.floor(set.tile / 3) * 50 + "%");
  } else {
    image.dataset.art = set.art;
  }
  const name = document.createElement("span");
  name.textContent = label;
  item.append(image, name);
  return item;
}

export function renderStickers(): void {
  const first = document.getElementById("gf-stickers-first");
  const bonus = document.getElementById("gf-stickers-bonus");
  if (!first || !bonus) return;
  let earnedCount = 0;
  first.replaceChildren();
  bonus.replaceChildren();
  for (const set of stickerSets) {
    const count = savedProgress.completed[set.mode] ?? 0;
    first.append(sticker(set, false, count >= 1));
    bonus.append(sticker(set, true, count >= 2));
    earnedCount += Math.min(count, 2);
  }
  const summary = document.getElementById("gf-sticker-count");
  if (summary)
    summary.textContent =
      earnedCount + " / " + stickerSets.length * 2 + " tarraa";
}
