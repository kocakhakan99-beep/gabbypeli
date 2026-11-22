import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = path.join(root, "assets/audio");
const phrases = new Set();
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collect(filename);
      continue;
    }
    if (!entry.name.endsWith(".ts")) continue;
    const source = ts.createSourceFile(
      filename,
      await readFile(filename, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(source) === "say"
      ) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument))
          phrases.add(argument.text);
      }
      if (
        ts.isPropertyAssignment(node) &&
        ["speech", "win"].includes(node.name.getText(source))
      ) {
        if (ts.isStringLiteralLike(node.initializer))
          phrases.add(node.initializer.text);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
await collect(path.join(root, "src"));
for (const text of [
  "Yksi.",
  "Kaksi.",
  "Kolme.",
  "Neljä.",
  "Viisi.",
  "Kuusi.",
  "Leivotaan 1 kuppikakkua. Kosketa taikinaa.",
  "Leivotaan 2 kuppikakkua. Kosketa taikinaa.",
  "Leivotaan 3 kuppikakkua. Kosketa taikinaa.",
  "Leivotaan 4 kuppikakkua. Kosketa taikinaa.",
  "Etsi suuri pallo.",
  "Etsi pieni pallo.",
  "Etsi kaikki siniset ympyrät.",
  "Etsi kaikki vaaleanpunaiset ympyrät.",
  "Etsi kaikki neliöt.",
])
  phrases.add(text);
const script = [...phrases]
  .sort()
  .map((text) => ({
    text,
    file: createHash("sha256").update(text).digest("hex").slice(0, 20) + ".mp3",
  }));
if (process.argv.includes("--dry-run")) {
  console.log(
    JSON.stringify(
      {
        phrases: script.length,
        characters: script.reduce((n, p) => n + p.text.length, 0),
        script,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
const key = process.env.ELEVENLABS_API_KEY;
const voice = process.env.ELEVENLABS_VOICE_ID;
if (!key || !voice)
  throw new Error(
    "Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in the local environment. Never place them in game files.",
  );
if (!/^[A-Za-z0-9_-]+$/.test(voice))
  throw new Error("Invalid voice identifier.");
await mkdir(output, { recursive: true });
const manifestPath = path.join(output, "manifest.json");
let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch {
  manifest = {};
}
const limitArg = process.argv.find((argument) =>
  argument.startsWith("--limit="),
);
const limit = limitArg ? Number(limitArg.slice(8)) : 10;
if (!Number.isSafeInteger(limit) || limit < 1)
  throw new Error("--limit must be a positive integer.");
let generated = 0;
for (const phrase of script) {
  if (manifest[phrase.text] || generated >= limit) continue;
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: phrase.text,
        model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
      }),
      signal: AbortSignal.timeout(60000),
    },
  );
  if (!response.ok)
    throw new Error(
      `Speech generation failed with HTTP ${response.status}. Completed clips remain saved.`,
    );
  const bytes = Buffer.from(await response.arrayBuffer());
  if (
    !bytes.length ||
    !(response.headers.get("content-type") || "").includes("audio")
  )
    throw new Error("Speech service did not return audio.");
  const temporary = path.join(output, phrase.file + ".tmp");
  await writeFile(temporary, bytes);
  await rename(temporary, path.join(output, phrase.file));
  manifest[phrase.text] = phrase.file;
  await writeFile(
    manifestPath + ".tmp",
    JSON.stringify(manifest, null, 2) + "\n",
  );
  await rename(manifestPath + ".tmp", manifestPath);
  generated++;
  console.log(`Saved speech clip ${generated}/${limit}.`);
}
console.log(
  `Generated ${generated} clips. Existing clips were reused. Re-run to continue.`,
);
