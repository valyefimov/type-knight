// Bundles the subset of TypeScript's lib.*.d.ts files needed to type-check
// ESNext code (no DOM/WebWorker) into a single JSON map, so the browser-side
// type checker (lib/type-checker.ts) can run `ts.createProgram` fully offline
// with an in-memory CompilerHost instead of depending on Monaco's web worker.
//
// Usage: node scripts/generate-ts-libs.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB_DIR = path.join(__dirname, '..', 'node_modules', 'typescript', 'lib');
const OUT = path.join(__dirname, '..', 'lib', 'ts-libs.json');

const files = fs
  .readdirSync(LIB_DIR)
  .filter((f) => /^lib\..*\.d\.ts$/.test(f))
  .filter((f) => !/\.full\.d\.ts$/.test(f))
  .filter((f) => !/dom|webworker|scripthost/i.test(f));

const bundle = {};
for (const file of files) {
  bundle[file] = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
}

fs.writeFileSync(OUT, JSON.stringify(bundle));
console.log(
  `wrote ${files.length} lib files (${Math.round(JSON.stringify(bundle).length / 1024)} KB) to ${OUT}`
);
