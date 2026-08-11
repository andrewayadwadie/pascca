#!/usr/bin/env node
// Article 16 [NN] / FR-005 (research R3): scans the given app directories — TS/TSX/JS/CSS
// source, not just what ESLint's JS parser touches — for a raw hex colour, `rgba()`/`rgb()`,
// a literal px `border-radius`, or a literal `cubic-bezier()` outside
// `packages/config/tokens.css`. Complements (does not replace) the widened `noRawHexColour`
// ESLint selector (base.js) — that one only ever sees JS/TS string/template literals.
//
// Usage: node scripts/check-hex-literals.mjs apps/web apps/admin
import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".mjs"]);
const IGNORE_DIRS = new Set(["node_modules", ".next", ".turbo", "dist", "coverage", ".git", "public"]);

const HEX = /#(?:[0-9a-fA-F]{3}){1,2}(?![0-9a-fA-F])/g;
const RGBA = /rgba?\(/g;
const CUBIC_BEZIER = /cubic-bezier\(/g;
const PX_RADIUS = /(?:border-radius|-radius)\s*:\s*[\d.]+px/gi;

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error("Usage: node scripts/check-hex-literals.mjs <dir> [<dir> ...]");
  process.exit(2);
}

/** @param {string} dir */
async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

let violations = [];

for (const root of roots) {
  for await (const file of walk(root)) {
    // The one file allowed to define these literals — everything else must reference it via var().
    if (file.endsWith("tokens.css")) continue;

    const text = readFileSync(file, "utf-8");
    for (const [pattern, label] of [
      [HEX, "raw hex colour"],
      [RGBA, "raw rgba()/rgb()"],
      [CUBIC_BEZIER, "raw cubic-bezier()"],
      [PX_RADIUS, "raw px border-radius"],
    ]) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text))) {
        const upToMatch = text.slice(0, match.index);
        const line = upToMatch.split("\n").length;
        violations.push(`${file}:${line} — ${label}: "${match[0]}"`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`check-hex-literals: ${violations.length} violation(s) found outside tokens.css:\n`);
  for (const v of violations) console.error(`  ${v}`);
  console.error(
    "\nAll colour, radius, and easing-curve values must come from packages/config/tokens.css (Article 16 [NN]).",
  );
  process.exit(1);
}

console.log(`check-hex-literals: clean — 0 violations across ${roots.join(", ")}`);
