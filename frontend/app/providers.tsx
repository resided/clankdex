'use client';

import { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterFrame } from '@farcaster/miniapp-wagmi-connector';
import { FarcasterProvider } from './components/FarcasterProvider';

// Create wagmi config with Farcaster miniapp connector
const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    farcasterFrame(),
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
