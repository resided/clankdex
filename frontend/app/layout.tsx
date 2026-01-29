import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

const APP_URL = 'https://frontend-weld-mu-91.vercel.app';
const OG_IMAGE_URL = `${APP_URL}/og`;  // Dynamic OG image

// Miniapp embed configuration (fc:miniapp meta tag)
const miniappEmbed = {
  version: "1",
  imageUrl: OG_IMAGE_URL,
  button: {
    title: "🎮 Launch ClankDex",
    action: {
      type: "launch_miniapp",
      name: "ClankDex",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#1a0a2e"
    }
  }
};

// Backward compatibility for fc:frame
const frameEmbed = {
  ...miniappEmbed,
  button: {
    ...miniappEmbed.button,
    action: {
      ...miniappEmbed.button.action,
      type: "launch_frame"
    }
  }
};

export const metadata: Metadata = {
  title: 'ClankDex - Wallet Pokedex',
  description: 'Generate a unique Pokemon-style creature from your wallet or Farcaster profile and launch it as a Clanker token. Track evolution as market cap grows!',
  metadataBase: new URL(APP_URL),
  manifest: '/manifest.json',
  openGraph: {
    title: 'ClankDex - Wallet Pokedex',
    description: 'Generate a unique Pokemon-style creature from your wallet or Farcaster profile and launch it as a Clanker token.',
    images: [OG_IMAGE_URL],
  },
  other: {
    // Base app ID for verification
    'base:app_id': '697a8a5228b944af8eb15519',
    // Farcaster Mini App embed (new)
    'fc:miniapp': JSON.stringify(miniappEmbed),
    // Farcaster Frame embed (backward compatibility)
    'fc:frame': JSON.stringify(frameEmbed),
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ClankDex" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-gray-900 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
