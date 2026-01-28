'use client';

import { ReactNode } from 'react';
import {
  RainbowKitProvider,
  getDefaultWallets,
  darkTheme
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { FarcasterProvider } from './components/FarcasterProvider';
import '@rainbow-me/rainbowkit/styles.css';

const { chains, publicClient } = configureChains(
  [base, baseSepolia],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'Clankdex',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains,
});

const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FarcasterProvider>
      <WagmiConfig config={config}>
        <RainbowKitProvider
          chains={chains}
          theme={darkTheme({
            accentColor: '#DC0A2D',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </WagmiConfig>
    </FarcasterProvider>
  );
}
