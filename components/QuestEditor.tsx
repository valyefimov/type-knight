'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import type { editor as MonacoEditorNS } from 'monaco-editor';
import Link from 'next/link';
import type { Challenge } from '@/lib/challenges';
import { editorSource, solutionsUrl, nextChallenge } from '@/lib/challenges';
import { TYPE_UTILS_LIB } from '@/lib/type-utils';
import { checkTypeScript } from '@/lib/type-checker';
import { addPoints, markCompleted } from '@/lib/progress';
import { getSolution, SOLUTIONS_SOURCE_URL } from '@/lib/solutions';

const MOTIVATIONS = [
  'The mainframe never saw it coming.',
  'Another firewall down. The corps are sweating.',
  'Clean exploit. No trace left behind.',
  'Your type-fu is getting sharper by the byte.',
  "That's how a real netrunner patches code.",
  'System owned. On to the next server.',
  'Flawless injection. The cat approves.',
  'You just made `any` extinct in one more file.',
];

const HINT_TIER_COST = [0, 3, 8];

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type Status = 'idle' | 'checking' | 'pass' | 'fail';

interface FlatDiagnostic {
  message: string;
  line: number;
}

let libRegistered = false;
let compilerOptionsSet = false;
let hljsRegistered = false;
if (!hljsRegistered) {
  hljs.registerLanguage('typescript', typescript);
  hljs.registerLanguage('ts', typescript);
  marked.use({
    renderer: {
      code({ text, lang }) {
        const language = lang && hljs.getLanguage(lang) ? lang : 'typescript';
        const highlighted = hljs.highlight(text, { language }).value;
        return `<pre class="hljs"><code>${highlighted}</code></pre>`;
      },
    },
  });
  hljsRegistered = true;
}

export default function QuestEditor({ challenge }: { challenge: Challenge }) {
  const [code, setCode] = useState(() => editorSource(challenge));
  const [status, setStatus] = useState<Status>('idle');
  const [diagnostics, setDiagnostics] = useState<FlatDiagnostic[]>([]);
  const [hintTier, setHintTier] = useState(0);
  const [liveErrors, setLiveErrors] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<{
    credits: number;
    message: string;
    sparks: { x: number; y: number; color: string; delay: number }[];
  } | null>(null);
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  const awardedRef = useRef(false);

  useEffect(() => {
    awardedRef.current = false;
  }, [challenge.slug]);

  const next = useMemo(() => nextChallenge(challenge), [challenge]);

  const descriptionHtml = useMemo(
    () => marked.parse(challenge.description || '', { async: false }) as string,
    [challenge.description]
  );

  const solution = useMemo(() => getSolution(challenge.id), [challenge.id]);
  const approachHtml = useMemo(
    () => (solution ? (marked.parse(solution.approach, { async: false }) as string) : ''),
    [solution]
  );
  const solutionCodeHtml = useMemo(
    () => (solution ? hljs.highlight(solution.solutionCode, { language: 'typescript' }).value : ''),
    [solution]
  );

  function makeSparks() {
    return Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const dist = 70 + Math.random() * 60;
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        color: i % 2 === 0 ? 'var(--neon-cyan)' : 'var(--neon-pink)',
        delay: Math.random() * 0.15,
      };
    });
  }

  function handleEditorWillMount(monaco: typeof import('monaco-editor')) {
    // Cosmetic only (inline red squiggles) - the authoritative pass/fail
    // check below runs its own independent, synchronous type checker rather
    // than depending on Monaco's web worker, which has proven unreliable in
    // this environment: a manually-acquired worker client throws "Could not
    // find source file" indefinitely, and its diagnostics adapter never runs
    // its first validation pass without a genuine edit event.
    if (!compilerOptionsSet) {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        lib: ['esnext'],
      });
      compilerOptionsSet = true;
    }
    if (!libRegistered) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        TYPE_UTILS_LIB,
        'ts:type-utils.d.ts'
      );
      libRegistered = true;
    }
  }

  function handleEditorMount(editorInstance: MonacoEditorNS.IStandaloneCodeEditor) {
    editorRef.current = editorInstance;
  }

  // Debounced live badge, computed independently with our own in-process
  // checker (see lib/type-checker.ts) instead of Monaco's markers.
  useEffect(() => {
    const timer = setTimeout(() => {
      setLiveErrors(checkTypeScript(code).length);
    }, 300);
    return () => clearTimeout(timer);
  }, [code]);

  function runCheck() {
    setStatus('checking');
    const errors = checkTypeScript(code);

    if (errors.length === 0) {
      setStatus('pass');
      setDiagnostics([]);
      markCompleted(challenge.slug);
      const credits = awardedRef.current ? 0 : Math.max(10 - HINT_TIER_COST[hintTier], 2);
      if (!awardedRef.current) {
        addPoints(credits);
        awardedRef.current = true;
      }
      setCelebration({
        credits,
        message: MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)],
        sparks: makeSparks(),
      });
    } else {
      setStatus('fail');
      setDiagnostics(errors);
    }
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 min-w-0">
      <div className="flex flex-col gap-6 min-w-0">
        <div className="neon-panel rounded-lg p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="font-display text-lg text-[var(--neon-pink)] glow-pink">
              #{challenge.id} {challenge.title}
            </h2>
            <div className="flex gap-1 flex-wrap justify-end">
              {challenge.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] uppercase tracking-wide text-[var(--neon-cyan)]/70 border border-[var(--neon-cyan)]/25 rounded px-1.5 py-0.5"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div
            className="prose-invert text-sm leading-relaxed text-[var(--foreground)]/85 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_code]:text-[var(--neon-cyan)] [&_pre]:my-4 [&_pre]:bg-black/40 [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        </div>

        <div className="neon-panel rounded-lg overflow-hidden relative">
          {status === 'pass' && <div className="neon-sweep absolute inset-0 pointer-events-none" />}
          <div className="border-b border-[var(--neon-cyan)]/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-display text-sm uppercase tracking-widest text-[var(--neon-cyan)] glow-cyan">
                Exploit Console
              </h3>
              {liveErrors !== null && (
                <span
                  className={
                    liveErrors > 0
                      ? 'text-[10px] uppercase tracking-wide text-[var(--glitch-red)] glow-glitch'
                      : 'text-[10px] uppercase tracking-wide text-[var(--neon-cyan)] glow-cyan'
                  }
                >
                  {liveErrors > 0
                    ? `${liveErrors} type error${liveErrors === 1 ? '' : 's'}`
                    : 'clean'}
                </span>
              )}
            </div>
            <button
              onClick={runCheck}
              disabled={status === 'checking'}
              className="text-sm font-display uppercase tracking-wider px-4 py-1.5 rounded border border-[var(--neon-pink)]/50 text-[var(--neon-pink)] hover:bg-[var(--neon-pink)]/10 disabled:opacity-50"
            >
              {status === 'checking' ? 'Compiling...' : 'Run Exploit'}
            </button>
          </div>
          <Editor
            height="480px"
            defaultLanguage="typescript"
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v ?? '')}
            beforeMount={handleEditorWillMount}
            onMount={handleEditorMount}
            options={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
          <div className="border-t border-[var(--neon-cyan)]/20 px-4 py-3 min-h-[64px] flex items-start gap-3">
            <span
              className={
                status === 'pass'
                  ? 'cat-mascot cat-swipe'
                  : status === 'fail'
                    ? 'cat-mascot cat-glitch'
                    : status === 'checking'
                      ? 'cat-mascot cat-alert'
                      : 'cat-mascot cat-idle'
              }
              aria-hidden
            >
              🐱
            </span>
            <div className="flex-1">
              {status === 'pass' && (
                <p className="text-[var(--neon-cyan)] glow-cyan font-display">
                  ⚡ Patch injected. The cyber-cat swipes the bug off the desk.
                </p>
              )}
              {status === 'fail' && (
                <ul className="space-y-1 text-sm text-[var(--glitch-red)]">
                  {diagnostics.map((d, i) => (
                    <li key={i} className="glow-glitch">
                      line {d.line}: {d.message}
                    </li>
                  ))}
                </ul>
              )}
              {status === 'idle' && (
                <p className="text-[var(--foreground)]/40 text-sm italic">
                  Awaiting patch. The firewall won&apos;t hold forever.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <aside className="neon-panel rounded-lg p-4 space-y-4 h-fit">
        <h3 className="font-display text-sm uppercase tracking-widest text-[var(--neon-cyan)]">
          Backchannel
        </h3>

        <a
          href="https://www.typescriptlang.org/docs/handbook/2/everyday-types.html"
          target="_blank"
          rel="noreferrer"
          className="block text-xs text-[var(--neon-cyan)]/70 hover:text-[var(--neon-pink)] underline"
        >
          TypeScript handbook →
        </a>

        <div className="border-t border-[var(--neon-cyan)]/15 pt-4 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-[var(--foreground)]/40">
            Hint tiers
          </p>

          {hintTier >= 1 && solution ? (
            <div className="text-xs text-[var(--foreground)]/80 leading-relaxed space-y-2 [&_a]:text-[var(--neon-cyan)] [&_a]:underline [&_code]:text-[var(--neon-cyan)] [&_pre]:my-2 [&_pre]:bg-black/40 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:text-[11px]">
              <div dangerouslySetInnerHTML={{ __html: approachHtml }} />
            </div>
          ) : (
            <button
              onClick={() => setHintTier(1)}
              disabled={!solution}
              className="w-full text-left text-xs px-3 py-2 rounded border border-[var(--neon-cyan)]/20 text-[var(--foreground)]/60 hover:border-[var(--neon-pink)]/50 hover:text-[var(--neon-pink)] disabled:opacity-30 disabled:hover:border-[var(--neon-cyan)]/20 disabled:hover:text-[var(--foreground)]/60"
            >
              Tier 1 · Decrypt approach{' '}
              <span className="text-[var(--foreground)]/40">
                {solution ? `(-${HINT_TIER_COST[1]} credits)` : '(no intel logged)'}
              </span>
            </button>
          )}

          {hintTier >= 1 && solution && (
            <>
              {hintTier >= 2 ? (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--foreground)]/40 mb-1">
                    Solution code
                  </p>
                  <pre
                    className="hljs text-[11px]"
                    dangerouslySetInnerHTML={{ __html: solutionCodeHtml }}
                  />
                  <p className="text-[10px] text-[var(--foreground)]/40 mt-2">
                    Walkthrough sourced from{' '}
                    <a
                      href={SOLUTIONS_SOURCE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--neon-cyan)]/70 hover:text-[var(--neon-pink)] underline"
                    >
                      ghaiklor/type-challenges-solutions
                    </a>{' '}
                    (CC-BY-4.0).
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setHintTier(2)}
                  className="w-full text-left text-xs px-3 py-2 rounded border border-[var(--neon-cyan)]/20 text-[var(--foreground)]/60 hover:border-[var(--neon-pink)]/50 hover:text-[var(--neon-pink)]"
                >
                  Tier 2 · Dump solution code{' '}
                  <span className="text-[var(--foreground)]/40">
                    (-{HINT_TIER_COST[2] - HINT_TIER_COST[1]} more credits)
                  </span>
                </button>
              )}
            </>
          )}

          <a
            href={solutionsUrl(challenge)}
            target="_blank"
            rel="noreferrer"
            className="block text-xs text-[var(--neon-pink)]/70 hover:text-[var(--neon-cyan)] underline"
          >
            More community solutions on GitHub →
          </a>
        </div>
      </aside>

      {celebration && (
        <div className="victory-overlay" onClick={() => setCelebration(null)}>
          <div className="victory-card neon-panel rounded-lg max-w-sm w-full p-6 text-center mx-4">
            {celebration.sparks.map((s, i) => (
              <span
                key={i}
                className="spark"
                style={
                  {
                    '--spark-x': `${s.x}px`,
                    '--spark-y': `${s.y}px`,
                    '--spark-color': s.color,
                    animationDelay: `${s.delay}s`,
                  } as React.CSSProperties
                }
              />
            ))}
            <p className="font-display text-lg uppercase tracking-widest text-[var(--neon-cyan)] glow-cyan mb-2">
              Access Granted
            </p>
            <p className="credit-pop font-display text-3xl text-[var(--neon-pink)] glow-pink mb-3">
              {celebration.credits > 0
                ? `+${celebration.credits} credits`
                : 'already cracked - no extra credits'}
            </p>
            <p className="text-sm text-[var(--foreground)]/80 italic mb-5">{celebration.message}</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => setCelebration(null)}
                className="text-sm font-display uppercase tracking-wider px-4 py-2 rounded border border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10"
              >
                Stay here
              </button>
              {next && (
                <Link
                  href={`/quest/${next.slug}`}
                  className="text-sm font-display uppercase tracking-wider px-4 py-2 rounded border border-[var(--neon-pink)]/50 text-[var(--neon-pink)] hover:bg-[var(--neon-pink)]/10"
                >
                  Next Exploit →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
