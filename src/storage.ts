import type { GameMode, Preferences, SavedProgress } from "./types.js";

const key = "gabbypeli-progress-v1";
const modes: GameMode[] = [
  "memory",
  "puzzle",
  "learn",
  "find",
  "sizes",
  "baking",
  "bubbles",
  "drawing",
  "garden",
];
const defaults: Preferences = {
  speech: true,
  effects: true,
  volume: 0.65,
  voice: "",
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
    for (const mode of modes) {
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
      fallback.preferences.voice =
        typeof preferences.voice === "string" ? preferences.voice : "";
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
  savedProgress.completed[mode] = Math.min(
    (savedProgress.completed[mode] ?? 0) + 1,
    9999,
  );
  saveProgress();
  renderStickers();
}

export function renderStickers(): void {
  const container = document.getElementById("gf-stickers");
  if (!container) return;
  container.replaceChildren();
  const labels = [
    "Kaverit",
    "Taikakuva",
    "Pikku apuri",
    "Tarkat silmät",
    "Vertailija",
    "Pikku leipuri",
    "Kuplataikuri",
    "Taiteilija",
    "Puutarhuri",
  ];
  const art = [
    "gabby",
    "fairy",
    "mercat",
    "gabby",
    "fairy",
    "cakey",
    "mercat",
    "gabby",
    "fairy",
  ];
  modes.forEach((mode, index) => {
    const earned = Boolean(savedProgress.completed[mode]);
    const sticker = document.createElement("div");
    sticker.className = "sticker" + (earned ? " earned" : "");
    sticker.setAttribute(
      "aria-label",
      labels[index] + (earned ? ", ansaittu" : ", odottaa leikkiä"),
    );
    const image = document.createElement("span");
    image.className = "picture";
    image.dataset.art = art[index];
    image.setAttribute("aria-hidden", "true");
    const name = document.createElement("span");
    name.textContent = labels[index];
    sticker.append(image, name);
    container.append(sticker);
  });
}
