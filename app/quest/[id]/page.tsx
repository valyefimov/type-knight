import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getChallenge } from '@/lib/challenges';
import QuestEditor from '@/components/QuestEditor';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const challenge = getChallenge(id);
  if (!challenge) return {};

  const title = `${challenge.title} (${challenge.level})`;
  const description = `Solve the "${challenge.title}" TypeScript type-challenge: patch the exploit console until strict TypeScript passes. Tags: ${challenge.tags.join(', ')}.`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
    alternates: { canonical: `/quest/${challenge.slug}` },
  };
}

export default async function QuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const challenge = getChallenge(id);
  if (!challenge) notFound();

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-10">
      <Link
        href="/"
        data-testid="disconnect-link"
        className="text-xs text-[var(--neon-cyan)]/70 hover:text-[var(--neon-pink)] font-display uppercase tracking-widest"
      >
        ← Disconnect
      </Link>
      <div className="mt-6">
        <QuestEditor challenge={challenge} />
      </div>
    </main>
  );
}
