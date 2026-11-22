import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../assets/audio/", import.meta.url);
const manifest = JSON.parse(
  fs.readFileSync(new URL("manifest.json", root), "utf8"),
);
const script = JSON.parse(
  fs.readFileSync(new URL("script.json", root), "utf8"),
);

test("only current Gabby voice clips are available to the game", () => {
  assert.equal(Object.keys(script.lines).length, 32);
  assert.equal(Object.keys(manifest).length, 32);
  for (const text of Object.keys(script.lines)) {
    assert.equal(script.lines[text].character, "gabby", text);
    assert.ok(manifest[text], text);
    assert.match(manifest[text], /^[a-z0-9-]+\.mp3$/);
    const bytes = fs.readFileSync(new URL(manifest[text], root));
    assert.ok(bytes.length > 500, text);
    assert.ok(
      bytes.subarray(0, 3).toString() === "ID3" || bytes[0] === 255,
      text,
    );
  }
  assert.ok(!Object.values(manifest).includes("baking-dialogue.mp3"));
});
