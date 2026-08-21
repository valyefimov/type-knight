import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Orbitron, JetBrains_Mono } from 'next/font/google';
import CyberBackground from '@/components/CyberBackground';
import SiteFooter from '@/components/SiteFooter';
import './globals.css';

const orbitron = Orbitron({
  variable: '--font-orbitron',
  subsets: ['latin'],
});

const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

const SITE_URL = 'https://type-knight.vercel.app';
const SITE_NAME = 'TypeKnight';
const DESCRIPTION =
  "Learn TypeScript's type system by hacking a cyberpunk network. Patch broken `any` code into strict, working types across all 190 real type-challenges puzzles, right in the browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Neon Cyber-Cat TypeScript Type Challenges`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    'TypeScript',
    'type challenges',
    'learn TypeScript types',
    'TypeScript generics',
    'TypeScript type system game',
    'conditional types',
    'mapped types',
    'coding game',
  ],
  authors: [{ name: 'Valentyn Yefimov', url: 'https://github.com/valyefimov' }],
  creator: 'Valentyn Yefimov',
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Neon Cyber-Cat TypeScript Type Challenges`,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Neon Cyber-Cat TypeScript Type Challenges`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <CyberBackground />
        <div className="flex-1 flex flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
