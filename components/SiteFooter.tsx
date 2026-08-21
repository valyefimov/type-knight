import pkg from '@/package.json';

export default function SiteFooter() {
  return (
    <footer
      data-testid="site-footer"
      className="border-t border-[var(--neon-cyan)]/15 px-4 py-4 text-center text-xs text-[var(--foreground)]/40"
    >
      Created by{' '}
      <a
        data-testid="author-link"
        href="https://github.com/valyefimov"
        target="_blank"
        rel="noreferrer"
        className="text-[var(--neon-cyan)]/70 hover:text-[var(--neon-pink)] underline"
      >
        Valentyn Yefimov
      </a>
      . Open source on{' '}
      <a
        data-testid="github-repo-link"
        href="https://github.com/valyefimov/type-knight"
        target="_blank"
        rel="noreferrer"
        className="text-[var(--neon-cyan)]/70 hover:text-[var(--neon-pink)] underline"
      >
        GitHub
      </a>
      .{' '}
      <span data-testid="app-version" className="text-[var(--foreground)]/30">
        v{pkg.version}
      </span>
    </footer>
  );
}
