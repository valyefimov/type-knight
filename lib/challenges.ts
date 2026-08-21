import raw from "./generated-challenges.json";

export type Level = "warmup" | "easy" | "medium" | "hard" | "extreme";

export interface Challenge {
  id: number;
  slug: string;
  title: string;
  level: Level;
  tags: string[];
  description: string; // raw markdown, official problem statement
  template: string;
  testCases: string;
}

export const LEVELS: { id: Level; name: string; desc: string }[] = [
  { id: "warmup", name: "Access Terminal", desc: "First exploits" },
  { id: "easy", name: "Corporate Firewall", desc: "Basic patches" },
  { id: "medium", name: "Data Vaults", desc: "Refactors and transforms" },
  { id: "hard", name: "The Deep Net", desc: "Recursive exploits" },
  { id: "extreme", name: "Mainframe Core", desc: "Forbidden root access" },
];

export const CHALLENGES = raw as Challenge[];

export function getChallenge(slug: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.slug === slug);
}

export function challengesByLevel(level: Level): Challenge[] {
  return CHALLENGES.filter((c) => c.level === level);
}

export function editorSource(challenge: Challenge): string {
  return `${challenge.template.trimEnd()}\n\n${challenge.testCases.trimEnd()}\n`;
}

export function solutionsUrl(challenge: Challenge): string {
  return `https://tsch.js.org/${challenge.id}/solutions`;
}

export function playgroundUrl(challenge: Challenge): string {
  return `https://tsch.js.org/${challenge.id}/play`;
}

export function nextChallenge(challenge: Challenge): Challenge | undefined {
  const siblings = challengesByLevel(challenge.level);
  const idx = siblings.findIndex((c) => c.slug === challenge.slug);
  if (idx !== -1 && idx < siblings.length - 1) return siblings[idx + 1];

  const levelIdx = LEVELS.findIndex((l) => l.id === challenge.level);
  for (let i = levelIdx + 1; i < LEVELS.length; i++) {
    const next = challengesByLevel(LEVELS[i].id);
    if (next.length > 0) return next[0];
  }
  return undefined;
}
