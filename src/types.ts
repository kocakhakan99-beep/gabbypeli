export type FriendId = "gabby" | "pandy" | "cakey" | "mercat" | "fairy" | "dj";
export type GameMode =
  | "memory"
  | "puzzle"
  | "learn"
  | "find"
  | "sizes"
  | "baking"
  | "bubbles"
  | "drawing"
  | "garden";
export interface Friend {
  id: FriendId;
  name: string;
  room: string;
  tile?: number;
}
export type Choice = [label: string, markup: string, correct: boolean];
export interface Lesson {
  art: number;
  title: string;
  speech: string;
  win: string;
  options: Choice[];
  pattern?: boolean;
}
export interface MemoryCard {
  friend: Pick<Friend, "name"> & { id: string };
  found: boolean;
}
export interface Preferences {
  speech: boolean;
  effects: boolean;
  volume: number;
}
export interface SavedProgress {
  version: 1;
  completed: Partial<Record<GameMode, number>>;
  preferences: Preferences;
}
export interface GameState {
  mode: GameMode | "";
  sound: boolean;
  ctx: AudioContext | null;
  memoryPairs: number;
  puzzleSize: number;
  puzzleArt: number;
  mem: MemoryCard[];
  opened: number[];
  matched: number;
  preview: boolean;
  waiting: boolean;
  selected: number | null;
  placed: Set<number>;
  learnIndex: number;
  learnDone: boolean;
  currentPrompt: string;
  action: (() => void) | null;
}
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
