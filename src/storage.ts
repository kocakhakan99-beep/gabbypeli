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
const extraStickers: Partial<
  Record<GameMode, { name: string; image: string }>
> = {
  memory: { name: "Tähtityyny", image: "objects/star" },
  puzzle: { name: "Purjevene", image: "objects/boat" },
  find: { name: "Salainen aarrearkku", image: "furniture/box" },
  baking: { name: "Kuppikakkutalot", image: "objects/cupcakes" },
  drawing: { name: "Sateenkaaripalikat", image: "objects/blocks" },
  garden: { name: "Kukkiva satupuu", image: "furniture/tree" },
};
type StickerTier = boolean | "extra";
function requiredPlays(tier: StickerTier): number {
  return tier === "extra" ? 3 : tier ? 2 : 1;
}
function stickerLabel(set: StickerSet, tier: StickerTier): string {
  return tier === "extra"
    ? extraStickers[set.mode]!.name
    : tier
      ? set.bonus
      : set.label;
}
type AlbumItem = { mode: GameMode; bonus: StickerTier; x: number; y: number };
const albumKey = "gabbypeli-sticker-page-v1";
let selectedSticker: { mode: GameMode; bonus: StickerTier } | null = null;
let album: AlbumItem[] = [];
try {
  const saved: unknown = JSON.parse(localStorage.getItem(albumKey) ?? "[]");
  if (Array.isArray(saved))
    album = saved
      .filter(
        (item): item is AlbumItem =>
          item &&
          stickerSets.some((set) => set.mode === item.mode) &&
          (typeof item.bonus === "boolean" ||
            (item.bonus === "extra" && extraStickers[item.mode as GameMode])) &&
          Number.isFinite(item.x) &&
          Number.isFinite(item.y) &&
          item.x >= 0 &&
          item.x <= 100 &&
          item.y >= 0 &&
          item.y <= 100,
      )
      .slice(0, 100);
} catch {
  /* The album starts empty if storage is unavailable. */
}

function saveAlbum(): void {
  try {
    localStorage.setItem(albumKey, JSON.stringify(album));
  } catch {
    /* Play continues without storage. */
  }
}

function stickerImage(set: StickerSet, bonus: StickerTier): HTMLElement {
  const image = document.createElement("span");
  image.className =
    "picture sticker-image" + (bonus === true ? " bonus-art" : "");
  const path =
    bonus === "extra"
      ? extraStickers[set.mode]!.image
      : `stickers/${bonus ? "bonus" : "character"}-${set.tile}`;
  image.style.backgroundImage = `url("./assets/${path}.webp")`;
  image.setAttribute("aria-hidden", "true");
  return image;
}

function renderAlbum(): void {
  const page = document.getElementById("gf-sticker-page");
  if (!page) return;
  page.replaceChildren();
  for (const item of album) {
    const set = stickerSets.find((entry) => entry.mode === item.mode);
    if (
      !set ||
      (savedProgress.completed[item.mode] ?? 0) < requiredPlays(item.bonus)
    )
      continue;
    const art = stickerImage(set, item.bonus);
    art.classList.add("album-sticker");
    art.style.left = item.x + "%";
    art.style.top = item.y + "%";
    art.setAttribute("aria-hidden", "true");
    art.addEventListener("click", (event) => event.stopPropagation());
    art.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      art.setPointerCapture(event.pointerId);
      art.classList.add("moving");
    });
    art.addEventListener("pointermove", (event) => {
      if (!art.hasPointerCapture(event.pointerId)) return;
      const rect = page.getBoundingClientRect();
      item.x = Math.max(
        0,
        Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
      );
      item.y = Math.max(
        0,
        Math.min(100, ((event.clientY - rect.top) / rect.height) * 100),
      );
      art.style.left = item.x + "%";
      art.style.top = item.y + "%";
    });
    art.addEventListener("pointerup", (event) => {
      event.stopPropagation();
      if (art.hasPointerCapture(event.pointerId))
        art.releasePointerCapture(event.pointerId);
      art.classList.remove("moving");
      saveAlbum();
    });
    art.addEventListener("pointercancel", () => {
      art.classList.remove("moving");
      saveAlbum();
    });
    page.append(art);
  }
}

function selectSticker(set: StickerSet, bonus: StickerTier): void {
  selectedSticker = { mode: set.mode, bonus };
  const preview = document.getElementById("gf-sticker-preview");
  if (!preview) return;
  preview.replaceChildren(stickerImage(set, bonus));
  const label = document.createElement("span");
  label.textContent = stickerLabel(set, bonus) + " – napauta sivua";
  preview.append(label);
}

export function initStickerAlbum(): void {
  const page = document.getElementById("gf-sticker-page");
  const undo = document.getElementById("gf-sticker-undo");
  if (!page || !undo) return;
  function place(x: number, y: number): void {
    if (!selectedSticker || album.length >= 100) return;
    album.push({
      ...selectedSticker,
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
    saveAlbum();
    renderAlbum();
  }
  page.addEventListener("click", (event) => {
    const rect = page.getBoundingClientRect();
    place(
      ((event.clientX - rect.left) / rect.width) * 100,
      ((event.clientY - rect.top) / rect.height) * 100,
    );
  });
  page.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      place(50, 50);
    }
  });
  undo.addEventListener("click", () => {
    album.pop();
    saveAlbum();
    renderAlbum();
  });
  renderAlbum();
}

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
  const tier =
    count === 3 && extraStickers[mode]
      ? "extra"
      : count <= 2
        ? count === 2
        : null;
  reward.hidden = !set || tier === null;
  if (set && tier !== null) {
    const title = document.createElement("strong");
    title.textContent = "Sait uuden tarran!";
    reward.append(title, sticker(set, tier, true));
  }
}

function sticker(
  set: StickerSet,
  bonus: StickerTier,
  earned: boolean,
): HTMLElement {
  const label = stickerLabel(set, bonus);
  const item = document.createElement("div");
  item.className = "sticker" + (earned ? " earned" : "");
  item.setAttribute(
    "aria-label",
    label +
      (earned
        ? ", ansaittu"
        : bonus === "extra"
          ? ", saat pelaamalla leikin loppuun kolmesti"
          : bonus
            ? ", saat pelaamalla leikin loppuun kahdesti"
            : ", odottaa leikkiä"),
  );
  const image = stickerImage(set, bonus);
  if (earned) {
    item.setAttribute("role", "button");
    item.tabIndex = 0;
    item.addEventListener("click", () => selectSticker(set, bonus));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectSticker(set, bonus);
      }
    });
  }
  const name = document.createElement("span");
  name.textContent = label;
  item.append(image, name);
  return item;
}

export function renderStickers(): void {
  const first = document.getElementById("gf-stickers-first");
  const bonus = document.getElementById("gf-stickers-bonus");
  const extra = document.getElementById("gf-stickers-extra");
  if (!first || !bonus) return;
  let earnedCount = 0;
  first.replaceChildren();
  bonus.replaceChildren();
  extra?.replaceChildren();
  for (const set of stickerSets) {
    const count = savedProgress.completed[set.mode] ?? 0;
    first.append(sticker(set, false, count >= 1));
    bonus.append(sticker(set, true, count >= 2));
    if (extraStickers[set.mode])
      extra?.append(sticker(set, "extra", count >= 3));
    earnedCount += Math.min(count, extraStickers[set.mode] ? 3 : 2);
  }
  const summary = document.getElementById("gf-sticker-count");
  if (summary)
    summary.textContent =
      earnedCount +
      " / " +
      (stickerSets.length * 2 + Object.keys(extraStickers).length) +
      " tarraa";
  renderAlbum();
}
