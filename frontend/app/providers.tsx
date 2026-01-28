'use client';

import { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterFrame } from '@farcaster/miniapp-wagmi-connector';
import { injected, walletConnect } from 'wagmi/connectors';
import { FarcasterProvider } from './components/FarcasterProvider';

// Create wagmi config with multiple connectors
const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    farcasterFrame(),
    injected({ target: 'metaMask' }),
    injected(),
    ...(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? [
      walletConnect({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        metadata: {
          name: 'ClankDex',
          description: 'Wallet Pokedex powered by Clanker',
          url: 'https://clankdex.vercel.app',
          icons: ['https://clankdex.vercel.app/icon.png'],
        },
      })
    ] : []),
  ],
});

const queryClient = new QueryClient();

// Base Miniapp SDK loader
function MiniappSDK({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize Base Miniapp context
    if (typeof window !== 'undefined') {
      // Set viewport for miniapp
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover');
      }
      
      // Prevent bounce scrolling in miniapp
      document.body.style.overscrollBehavior = 'none';
    }
  }, []);
  
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FarcasterProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <MiniappSDK>
            {children}
          </MiniappSDK>
        </QueryClientProvider>
      </WagmiProvider>
    </FarcasterProvider>
  );
}
