'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CHALLENGES, LEVELS, challengesByLevel } from '@/lib/challenges';
import { getCompleted, getPoints } from '@/lib/progress';

export default function DungeonMap() {
  const [completed] = useState<Set<string>>(() => getCompleted());
  const [points] = useState(() => getPoints());
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
      <header className="mb-10 text-center">
        <h1 className="font-display text-4xl md:text-5xl text-[var(--neon-pink)] glow-pink tracking-wide">
          TypeKnight
        </h1>
        <p className="mt-2 text-sm text-[var(--neon-cyan)]/70 font-display tracking-widest uppercase">
          Neon Cyber-Cat // Root Access
        </p>
        <p className="mt-6 text-[var(--foreground)]/80 max-w-xl mx-auto leading-relaxed">
          Corporate servers run on rotten{' '}
          <span className="text-[var(--glitch-red)] glow-glitch">any</span> code. A cyber-cat hacker
          jacks into the mainframe, swapping every broken function for strict TypeScript types
          before the firewall reboots.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 text-xs text-[var(--neon-cyan)] font-display tracking-widest uppercase">
          <span>
            Cracked {completed.size}/{CHALLENGES.length}
          </span>
          <span className="text-[var(--foreground)]/30">•</span>
          <span>{points} credits</span>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="grep exploit..."
          className="mt-6 w-full max-w-sm mx-auto block bg-black/40 border border-[var(--neon-cyan)]/30 rounded px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:border-[var(--neon-pink)]/60"
        />
      </header>

      <div className="space-y-10">
        {LEVELS.map((level) => {
          const list = challengesByLevel(level.id).filter(
            (c) => !q || c.title.toLowerCase().includes(q) || c.slug.includes(q)
          );
          if (list.length === 0) return null;
          return (
            <section key={level.id} className="neon-panel rounded-lg p-6">
              <h2 className="font-display text-xl text-[var(--neon-pink)] glow-pink">
                {level.name}
              </h2>
              <p className="text-xs text-[var(--foreground)]/50 mb-4">
                {level.desc} • {list.length} target{list.length === 1 ? '' : 's'}
              </p>
              <ul className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {list.map((c) => {
                  const done = completed.has(c.slug);
                  return (
                    <li key={c.slug}>
                      <Link
                        href={`/quest/${c.slug}`}
                        className="cyber-card flex items-center justify-between gap-3 rounded-md border border-[var(--neon-cyan)]/20 bg-black/30 px-3 py-2 hover:border-[var(--neon-pink)]/60 hover:bg-black/50 hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(255,62,200,0.25)] transition-all duration-150"
                      >
                        <span className="text-sm truncate">
                          <span className="text-[var(--foreground)]/30 mr-1">{c.id}</span>
                          {c.title}
                        </span>
                        <span
                          className={
                            done
                              ? 'text-[var(--neon-cyan)] glow-cyan text-lg shrink-0'
                              : 'text-[var(--foreground)]/25 text-lg shrink-0'
                          }
                        >
                          {done ? '◉' : '○'}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
