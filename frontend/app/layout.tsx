import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://clankdex.io';

export const metadata: Metadata = {
  title: 'Clankdex - Wallet Pokedex',
  description: 'Discover your blockchain creature and launch it as a Clanker token!',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'Clankdex - Wallet Pokedex',
    description: 'Generate a unique Pokemon-style creature from your wallet or Farcaster profile and launch it as a Clanker token.',
    images: ['/og-image.png'],
  },
  other: {
    // Farcaster Mini App (v2 frame) meta tags
    'fc:frame': 'vNext',
    'fc:frame:image': `${APP_URL}/frame-image.png`,
    'fc:frame:image:aspect_ratio': '1:1',
    'fc:frame:button:1': 'Launch Clankdex',
    'fc:frame:button:1:action': 'launch_frame',
    'fc:frame:button:1:target': APP_URL,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#DC0A2D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-900 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
