// Bundles walkthroughs from ghaiklor/type-challenges-solutions (CC-BY-4.0,
// attribution kept in the UI) keyed by the official type-challenges numeric
// id, so the "Backchannel" panel can show a real approach + solution code
// instead of only linking out to GitHub.
//
// Usage:
//   git clone --depth 1 https://github.com/ghaiklor/type-challenges-solutions.git /tmp/tcs
//   node scripts/generate-solutions.mjs /tmp/tcs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const repoPath = process.argv[2];
if (!repoPath) {
  console.error("Usage: node scripts/generate-solutions.mjs <path-to-type-challenges-solutions>");
  process.exit(1);
}

const EN_DIR = path.join(repoPath, "en");
const OUT = path.join(__dirname, "..", "lib", "generated-solutions.json");

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const [, fm, body] = match;
  const data = {};
  for (const line of fm.split("\n")) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) data[m[1]] = m[2].trim();
  }
  return { id: Number(data.id), body };
}

function extractSection(body, heading, nextHeadings) {
  const startIdx = body.indexOf(`## ${heading}`);
  if (startIdx === -1) return "";
  let endIdx = body.length;
  for (const next of nextHeadings) {
    const idx = body.indexOf(`## ${next}`, startIdx + 1);
    if (idx !== -1 && idx < endIdx) endIdx = idx;
  }
  return body.slice(startIdx + `## ${heading}`.length, endIdx).trim();
}

function extractSolutionCode(solutionSection) {
  // Some walkthroughs build the answer up across several code blocks (a
  // helper type, then the final type), but others show a wrong/intermediate
  // attempt before correcting it under the *same* name a few paragraphs
  // later — concatenating naively produces duplicate declarations. Keep
  // only the last block that defines each declared name, dropping earlier
  // superseded attempts, then reassemble in original order.
  const blocks = [...solutionSection.matchAll(/```(?:ts|typescript)\n([\s\S]*?)```/g)].map((m) =>
    m[1].trim()
  );
  const lastBlockForName = new Map();
  const anonymousIdx = new Set();
  blocks.forEach((code, idx) => {
    const names = [
      ...code.matchAll(/^(?:export\s+)?(?:declare\s+)?(?:type|interface|function|const)\s+(\w+)/gm),
    ].map((m) => m[1]);
    if (names.length === 0) {
      anonymousIdx.add(idx);
    } else {
      for (const name of names) lastBlockForName.set(name, idx);
    }
  });
  const keepIdx = new Set([...lastBlockForName.values(), ...anonymousIdx]);
  return blocks.filter((_, idx) => keepIdx.has(idx)).join("\n\n");
}

const files = fs.readdirSync(EN_DIR).filter((f) => f.endsWith(".md"));
const solutions = {};

for (const file of files) {
  const raw = fs.readFileSync(path.join(EN_DIR, file), "utf8");
  const parsed = parseFrontmatter(raw);
  if (!parsed || !parsed.id) continue;

  const approach = extractSection(parsed.body, "Solution", ["References"]);
  const references = extractSection(parsed.body, "References", []);
  const solutionCode = extractSolutionCode(approach);

  if (!approach) continue;

  solutions[parsed.id] = {
    approach,
    solutionCode,
    references,
  };
}

fs.writeFileSync(OUT, JSON.stringify(solutions));
console.log(`wrote ${Object.keys(solutions).length} solution walkthroughs to ${OUT}`);
