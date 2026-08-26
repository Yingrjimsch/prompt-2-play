import { access, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const gamesDirectory = path.join(root, "games");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const fail = (source, message) => {
  throw new Error(`${path.relative(root, source)}: ${message}`);
};

const requireString = (value, field, source) => {
  if (typeof value !== "string" || value.trim() === "") fail(source, `\"${field}\" must be a non-empty string`);
};

const directories = (await readdir(gamesDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const games = [];
for (const directory of directories) {
  const gameDirectory = path.join(gamesDirectory, directory);
  const source = path.join(gameDirectory, "prompt.json");
  let metadata;

  try {
    metadata = JSON.parse(await readFile(source, "utf8"));
  } catch (error) {
    fail(source, error.code === "ENOENT" ? "missing prompt.json" : `invalid JSON (${error.message})`);
  }

  const { schemaVersion, game, generation } = metadata;
  if (schemaVersion !== 1) fail(source, '"schemaVersion" must be 1');
  if (!game || typeof game !== "object") fail(source, 'missing "game" object');
  if (!generation || typeof generation !== "object") fail(source, 'missing "generation" object');

  for (const field of ["slug", "name", "description", "createdAt", "genre", "preview"]) requireString(game[field], `game.${field}`, source);
  for (const field of ["model", "author", "harness", "prompt"]) requireString(generation[field], `generation.${field}`, source);
  if (!slugPattern.test(game.slug)) fail(source, '"game.slug" must contain lowercase letters, numbers, and single hyphens only');
  if (game.slug !== directory) fail(source, `"game.slug" must match its directory name (${directory})`);
  const parsedDate = new Date(`${game.createdAt}T00:00:00Z`);
  if (!datePattern.test(game.createdAt) || Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== game.createdAt) fail(source, '"game.createdAt" must be a valid YYYY-MM-DD date');
  if (!Array.isArray(game.controls) || game.controls.length === 0 || game.controls.some((control) => typeof control !== "string" || !control.trim())) fail(source, '"game.controls" must be a non-empty array of strings');

  const normalizedPreview = path.posix.normalize(game.preview);
  if (normalizedPreview !== game.preview || normalizedPreview.startsWith("../") || path.posix.isAbsolute(normalizedPreview)) fail(source, '"game.preview" must be a project-relative path without traversal');
  try {
    await access(path.join(root, normalizedPreview));
    await access(path.join(gameDirectory, "index.html"));
  } catch (error) {
    fail(source, error.path.endsWith("index.html") ? "missing index.html" : `preview file does not exist (${game.preview})`);
  }

  games.push({ schemaVersion, game, generation });
}

games.sort((a, b) => a.game.createdAt.localeCompare(b.game.createdAt) || a.game.slug.localeCompare(b.game.slug));
const manifest = games.map((metadata, index) => ({ ...metadata, number: index + 1 })).reverse();
await writeFile(path.join(root, "games.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated games.json with ${manifest.length} game${manifest.length === 1 ? "" : "s"}.`);
