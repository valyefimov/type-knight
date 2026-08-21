// Regenerates lib/generated-challenges.json from a local clone of
// https://github.com/type-challenges/type-challenges
//
// Usage:
//   git clone --depth 1 https://github.com/type-challenges/type-challenges.git /tmp/type-challenges
//   node scripts/generate-challenges.mjs /tmp/type-challenges

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const repoPath = process.argv[2];
if (!repoPath) {
  console.error('Usage: node scripts/generate-challenges.mjs <path-to-type-challenges-clone>');
  process.exit(1);
}

const QUESTIONS = path.join(repoPath, 'questions');
const OUT = path.join(__dirname, '..', 'lib', 'generated-challenges.json');

const LEVEL_MAP = {
  warm: 'warmup',
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
  extreme: 'extreme',
};

function parseInfoYml(content) {
  const lines = content.split('\n');
  const result = { title: '', difficulty: '', tags: [] };
  for (const line of lines) {
    const titleMatch = line.match(/^title:\s*(.+)$/);
    if (titleMatch) result.title = titleMatch[1].trim();
    const diffMatch = line.match(/^difficulty:\s*(.+)$/);
    if (diffMatch) result.difficulty = diffMatch[1].trim();
    const tagsMatch = line.match(/^tags:\s*(.+)$/);
    if (tagsMatch) {
      result.tags = tagsMatch[1]
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
  }
  return result;
}

function extractDescription(readme) {
  const startTag = '<!--info-header-end-->';
  const endTag = '<!--info-footer-start-->';
  const startIdx = readme.indexOf(startTag);
  const endIdx = readme.indexOf(endTag);
  if (startIdx === -1 || endIdx === -1) return '';
  return readme.slice(startIdx + startTag.length, endIdx).trim();
}

function stripImportLine(testCases) {
  return (
    testCases
      .replace(/^import type \{[^}]*\}\s*from\s*'@type-challenges\/utils'\s*\n+/, '')
      .trimEnd() + '\n'
  );
}

const dirs = fs
  .readdirSync(QUESTIONS)
  .filter((d) => fs.statSync(path.join(QUESTIONS, d)).isDirectory());

const challenges = [];

for (const dir of dirs) {
  const full = path.join(QUESTIONS, dir);
  const m = dir.match(/^(\d+)-([a-z]+)-(.+)$/);
  if (!m) {
    console.warn('skip (no match):', dir);
    continue;
  }
  const [, idStr, diffSlug, slug] = m;
  const id = Number(idStr);

  const infoPath = path.join(full, 'info.yml');
  const templatePath = path.join(full, 'template.ts');
  const testPath = path.join(full, 'test-cases.ts');
  const readmePath = path.join(full, 'README.md');

  if (!fs.existsSync(infoPath) || !fs.existsSync(templatePath) || !fs.existsSync(testPath)) {
    console.warn('skip (missing files):', dir);
    continue;
  }

  const info = parseInfoYml(fs.readFileSync(infoPath, 'utf8'));
  const level = LEVEL_MAP[info.difficulty] || LEVEL_MAP[diffSlug];
  if (!level) {
    console.warn('skip (unknown level):', dir, info.difficulty, diffSlug);
    continue;
  }

  const template = fs.readFileSync(templatePath, 'utf8').trimEnd() + '\n';
  const testCasesRaw = fs.readFileSync(testPath, 'utf8');
  const testCases = stripImportLine(testCasesRaw);
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
  const description = extractDescription(readme);

  challenges.push({
    id,
    slug,
    title: info.title || slug,
    level,
    tags: info.tags,
    description,
    template,
    testCases,
  });
}

challenges.sort((a, b) => a.id - b.id);

fs.writeFileSync(OUT, JSON.stringify(challenges, null, 0));
console.log('wrote', challenges.length, 'challenges to', OUT);

const byLevel = {};
for (const c of challenges) byLevel[c.level] = (byLevel[c.level] || 0) + 1;
console.log(byLevel);
