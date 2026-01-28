'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Types for Farcaster Frame SDK
interface FarcasterContext {
  user: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    custodyAddress?: string;
    verifiedAddresses?: string[];
  } | null;
}

interface FrameSDK {
  context: FarcasterContext;
  actions: {
    ready: (options?: { disableNativeGestures?: boolean }) => Promise<void>;
    close: () => Promise<void>;
    openUrl: (url: string) => Promise<void>;
    composeCast: (params: { text?: string; embeds?: string[] }) => Promise<void>;
    addFrame: () => Promise<void>;
  };
  wallet: {
    ethProvider: any;
  };
}

interface FarcasterContextType {
  sdk: FrameSDK | null;
  isFrameContext: boolean;
  user: FarcasterContext['user'];
  isReady: boolean;
  composeCast: (text: string, embeds?: string[]) => Promise<void>;
}

const FarcasterCtx = createContext<FarcasterContextType>({
  sdk: null,
  isFrameContext: false,
  user: null,
  isReady: false,
  composeCast: async () => {},
});

export function useFarcaster() {
  return useContext(FarcasterCtx);
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [sdk, setSdk] = useState<FrameSDK | null>(null);
  const [isFrameContext, setIsFrameContext] = useState(false);
  const [user, setUser] = useState<FarcasterContext['user']>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initFarcaster = async () => {
      try {
        // Only import in browser
        if (typeof window === 'undefined') return;

        // Dynamic import of the Frame SDK
        const { sdk: frameSdk } = await import('@farcaster/frame-sdk');

        // Check if we're in a frame context
        const context = await frameSdk.context;

        if (context && context.user) {
          console.log('Running in Farcaster frame context');
          setIsFrameContext(true);
          setUser(context.user);
          setSdk(frameSdk as unknown as FrameSDK);

          // Signal that the app is ready
          await frameSdk.actions.ready({ disableNativeGestures: false });
          console.log('Farcaster SDK ready');
        } else {
          console.log('Not in Farcaster frame context, running standalone');
          setIsFrameContext(false);
        }

        setIsReady(true);
      } catch (error) {
        console.log('Farcaster SDK not available:', error);
        setIsFrameContext(false);
        setIsReady(true);
      }
    };

    initFarcaster();
  }, []);

  const composeCast = async (text: string, embeds?: string[]) => {
    if (sdk && isFrameContext) {
      await sdk.actions.composeCast({ text, embeds });
    } else {
      // Fallback to Warpcast web
      const params = new URLSearchParams({ text });
      if (embeds?.length) {
        params.append('embeds[]', embeds[0]);
      }
      window.open(`https://warpcast.com/~/compose?${params.toString()}`, '_blank');
    }
  };

  return (
    <FarcasterCtx.Provider value={{ sdk, isFrameContext, user, isReady, composeCast }}>
      {children}
    </FarcasterCtx.Provider>
  );
}
