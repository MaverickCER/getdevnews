import type { Metadata } from 'next';
import type { Viewport } from 'next';
import './globals.css';
import { ReactNode } from 'react';
import noticia from '@/lib/noticia';

type TRootLayoutProps = {
  children: ReactNode;
};

// https://nextjs.org/docs/app/api-reference/functions/generate-viewport
// <meta name="viewport" content="width=device-width, initial-scale=1" /> is a default
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#23272E' },
  ],
};

// https://nextjs.org/docs/app/building-your-application/optimizing/metadata
export const metadata: Metadata = {
  metadataBase: new URL('https://www.getDevNews.com'),
  title: 'getDevNews()',
  description: 'A news aggregator for developers by developers',
  openGraph: {
    images: 'https://www.getDevNews.com/thumbnail.webp',
    title: 'Get Dev News',
    description:
      'A news aggregation service covering ai, game, web, and xr development for professionals.',
    url: 'https://www.getDevNews.com',
    siteName: 'getDevNews',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get Dev News',
    description:
      'A news aggregation service by developers for developers covering web, game, and xr development trends.',
    creator: '@MaverickCER',
    creatorId: '1393988478107623425',
    images: ['https://www.getDevNews.com/thumbnail.webp'],
  },
  category: 'news',
  generator: 'getDevNews',
  applicationName: 'getDevNews',
  referrer: 'origin-when-cross-origin',
  keywords: [
    'getDevNews',
    'developer',
    'news',
    'web',
    'game',
    'xr',
    'ar',
    'vr',
    'virtual reality',
    'augmented reality',
    'aggregator',
    'aggregation',
  ],
  authors: [{ name: 'Maverick Manasco', url: 'https://www.maverickmanasco.dev' }],
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
    },
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/shortcut-icon.png',
    apple: '/apple-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png',
    },
  },
  manifest: 'https://www.getdevnews.com/manifest.json',
};

export default function RootLayout({ children }: TRootLayoutProps) {
  return (
    <html lang='en'>
      {/* noticia is the next/font set up for this site */}
      <body className={noticia}>{children}</body>
    </html>
  );
}
