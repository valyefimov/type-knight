'use client';

const COMPLETED_KEY = 'typeknight-completed';
const POINTS_KEY = 'typeknight-points';

export function getCompleted(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(COMPLETED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markCompleted(id: string) {
  const set = getCompleted();
  if (set.has(id)) return;
  set.add(id);
  window.localStorage.setItem(COMPLETED_KEY, JSON.stringify([...set]));
}

export function getPoints(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(POINTS_KEY);
  return raw ? Number(raw) : 0;
}

export function addPoints(delta: number) {
  const next = getPoints() + delta;
  window.localStorage.setItem(POINTS_KEY, String(next));
  return next;
}
