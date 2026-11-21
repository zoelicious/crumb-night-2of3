// CRUMB — handoff script for the night-kitchen stealth entry (best-stealth 2/3, agent 4).
//
// What this file does, in plain terms: it takes the finished playable folder
// (game/) and the four cover shots (screenshots/) that sit next to this file,
// places copies of both inside the grader's output folder, and then asks the
// vendored make.fun helper to write the dossier.json summary the judge reads.
// The game itself lives in game/ and is untouched by this script; this file
// only moves files around and calls the dossier builder. Run it like:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// When MAKEFUN_OUTPUT_DIR is not set, the grader's default folder is used.

import { cpSync as copyTree, existsSync as pathExists, mkdirSync as makeDir, writeFileSync as writeText } from 'node:fs';
import { join as joinPath } from 'node:path';
import { fileURLToPath as urlToPath } from 'node:url';
import { buildDossier as makeDossier } from './vendor/makefun-game.ts';

// Fallback destination when the grader does not hand us one.
const DEFAULT_OUTPUT = '/output';

// Scorer limits, kept exactly as the kit's gate expects them.
const TEXT_BUDGET = 163840;
const SHOT_LIMIT = 4;
const SHOT_BUDGET = 262144;
const GAME_FILE_LIMIT = 993;
const GAME_BYTE_LIMIT = 50331648;
const GAME_PATH_LIMIT = 1000;

// Folder holding this script, resolved from its own URL so the script
// works no matter which directory it is launched from.
function repoRoot(): string {
  return urlToPath(new URL('.', import.meta.url));
}

// The grader tells us where to deliver through the environment; use the
// value exactly as given, and only fall back when it is absent.
function deliveryDir(): string {
  return process.env.MAKEFUN_OUTPUT_DIR ?? DEFAULT_OUTPUT;
}

function deliverGame(root: string, dest: string): void {
  makeDir(dest, { recursive: true });
  copyTree(joinPath(root, 'game'), joinPath(dest, 'game'), { recursive: true });
}

function deliverShots(root: string, dest: string): void {
  const shotsDest = joinPath(dest, 'screenshots');
  makeDir(shotsDest, { recursive: true });
  const shotsSrc = joinPath(root, 'screenshots');
  if (pathExists(shotsSrc)) {
    copyTree(shotsSrc, shotsDest, { recursive: true });
  }
}

function deliverDossier(dest: string): void {
  const limits = {
    text_max_bytes: TEXT_BUDGET,
    screenshots: { max: SHOT_LIMIT, max_bytes: SHOT_BUDGET },
    game_max_files: GAME_FILE_LIMIT,
    game_max_bytes: GAME_BYTE_LIMIT,
    game_path_max_bytes: GAME_PATH_LIMIT,
  };
  writeText(joinPath(dest, 'dossier.json'), makeDossier(dest, limits));
}

function handInCrumb(): void {
  const root = repoRoot();
  const dest = deliveryDir();
  deliverGame(root, dest);
  deliverShots(root, dest);
  deliverDossier(dest);
  console.log(`CRUMB handed in: night-kitchen game + 4 screenshots copied to ${dest}; dossier.json written.`);
}

handInCrumb();
