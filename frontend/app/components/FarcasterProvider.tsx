'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import sdk, { Context } from '@farcaster/miniapp-sdk';

type MiniAppContext = Context.MiniAppContext;
type UserContext = Context.UserContext;

interface FarcasterContextType {
  context: MiniAppContext | null;
  isFrameContext: boolean;
  user: UserContext | null;
  isReady: boolean;
  composeCast: (text: string, embeds?: string[]) => Promise<void>;
  openUrl: (url: string) => Promise<void>;
  close: () => Promise<void>;
}

const FarcasterCtx = createContext<FarcasterContextType>({
  context: null,
  isFrameContext: false,
  user: null,
  isReady: false,
  composeCast: async () => {},
  openUrl: async () => {},
  close: async () => {},
});

export function useFarcaster() {
  return useContext(FarcasterCtx);
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<MiniAppContext | null>(null);
  const [isFrameContext, setIsFrameContext] = useState(false);
  const [user, setUser] = useState<UserContext | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initFarcaster = async () => {
      try {
        // Only run in browser
        if (typeof window === 'undefined') return;

        // Get the context from the miniapp SDK
        const miniAppContext = await sdk.context;

        if (miniAppContext && miniAppContext.user) {
          console.log('Running in Farcaster miniapp context', miniAppContext);
          setIsFrameContext(true);
          setContext(miniAppContext);
          setUser(miniAppContext.user);

          // Signal that the app is ready to be displayed
          await sdk.actions.ready();
          console.log('Farcaster miniapp SDK ready');
        } else {
          console.log('Not in Farcaster miniapp context, running standalone');
          setIsFrameContext(false);
        }

        setIsReady(true);
      } catch (error) {
        console.log('Farcaster miniapp SDK not available:', error);
        setIsFrameContext(false);
        setIsReady(true);
      }
    };

    initFarcaster();
  }, []);

  const composeCast = useCallback(async (text: string, embeds?: string[]) => {
    if (isFrameContext) {
      try {
        // SDK expects embeds as tuple: [] | [string] | [string, string]
        let embedsTuple: [] | [string] | [string, string] | undefined;
        if (embeds && embeds.length > 0) {
          if (embeds.length === 1) {
            embedsTuple = [embeds[0]];
          } else {
            embedsTuple = [embeds[0], embeds[1]];
          }
        }
        await sdk.actions.composeCast({
          text,
          embeds: embedsTuple,
        });
      } catch (error) {
        console.error('Failed to compose cast:', error);
        openWarpcastCompose(text, embeds);
      }
    } else {
      openWarpcastCompose(text, embeds);
    }
  }, [isFrameContext]);

  const openUrl = useCallback(async (url: string) => {
    if (isFrameContext) {
      try {
        await sdk.actions.openUrl(url);
      } catch (error) {
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  }, [isFrameContext]);

  const close = useCallback(async () => {
    if (isFrameContext) {
      await sdk.actions.close();
    }
  }, [isFrameContext]);

  return (
    <FarcasterCtx.Provider value={{ context, isFrameContext, user, isReady, composeCast, openUrl, close }}>
      {children}
    </FarcasterCtx.Provider>
  );
}

function openWarpcastCompose(text: string, embeds?: string[]) {
  const params = new URLSearchParams({ text });
  if (embeds?.length) {
    embeds.forEach(embed => params.append('embeds[]', embed));
  }
  window.open(`https://warpcast.com/~/compose?${params.toString()}`, '_blank');
}
