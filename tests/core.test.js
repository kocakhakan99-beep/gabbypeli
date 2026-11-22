import test from "node:test";
import assert from "node:assert/strict";
import { shuffle } from "../app/utils.js";
import { readProgress, completeGame, savedProgress } from "../app/storage.js";

function storage(value, unavailable = false) {
  globalThis.localStorage = {
    getItem() {
      if (unavailable) throw new Error("blocked");
      return value;
    },
    setItem(key, next) {
      if (unavailable) throw new Error("blocked");
      value = next;
    },
  };
  globalThis.document = { getElementById: () => null };
}

test("saved settings and earned stickers survive serialization", () => {
  storage(null);
  savedProgress.completed = {};
  completeGame("baking");
  completeGame("baking");
  assert.equal(readProgress().completed.baking, 2);
  assert.equal(readProgress().preferences.volume, 0.65);
});

test("invalid and unavailable storage keeps the game playable", () => {
  for (const value of ["broken", "null", '{"version":0}', "42"]) {
    storage(value);
    assert.deepEqual(readProgress().completed, {});
  }
  storage(null, true);
  assert.doesNotThrow(() => completeGame("memory"));
});

test("stored values are checked before use", () => {
  storage(
    JSON.stringify({
      version: 1,
      completed: { memory: -2, puzzle: 1e10, find: "bad" },
      preferences: { volume: 20, speech: false, effects: true, voice: 42 },
    }),
  );
  const saved = readProgress();
  assert.equal(saved.completed.memory, undefined);
  assert.equal(saved.completed.find, undefined);
  assert.equal(saved.completed.puzzle, 9999);
  assert.equal(saved.preferences.volume, 1);
  assert.equal(saved.preferences.speech, false);
});

test("shuffling preserves each card and the original input", () => {
  const cards = ["a", "a", "b", "b", "c", "c"];
  for (let i = 0; i < 20; i++)
    assert.deepEqual(shuffle(cards).sort(), [...cards].sort());
  assert.deepEqual(cards, ["a", "a", "b", "b", "c", "c"]);
});
