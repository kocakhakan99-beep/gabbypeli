import type { GameState } from "./types.js";

export const state: GameState = {
  mode: "",
  sound: true,
  ctx: null,
  memoryPairs: 2,
  puzzleSize: 2,
  puzzleArt: 1,
  mem: [],
  opened: [],
  matched: 0,
  preview: true,
  waiting: false,
  selected: null,
  placed: new Set(),
  learnIndex: 0,
  learnDone: false,
  currentPrompt: "",
  action: null,
};
