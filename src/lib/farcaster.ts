'use client';

import { useEffect, useState, useRef } from 'react';

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface FarcasterState {
  isInMiniApp: boolean;
  isLoading: boolean;
  user: FarcasterUser | null;
}

export function useFarcasterMiniApp(): FarcasterState {
  const [state, setState] = useState<FarcasterState>({
    isInMiniApp: false,
    isLoading: true,
    user: null,
  });
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    import('@farcaster/miniapp-sdk')
      .then(async ({ sdk }) => {
        const isMiniApp = await sdk.isInMiniApp();
        if (!isMiniApp) {
          setState({ isInMiniApp: false, isLoading: false, user: null });
          return;
        }

        // Farcasterのスプラッシュを消す
        sdk.actions.ready();

        // Farcasterウォレットをwindow.ethereumに公開
        try {
          const ethProvider = await sdk.wallet.getEthereumProvider();
          if (ethProvider && typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).ethereum = ethProvider;
          }
        } catch {
          // ウォレットプロバイダー非対応
        }

        let user: FarcasterUser | null = null;
        try {
          const context = await sdk.context;
          if (context?.user) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const u = context.user as any;
            user = {
              fid: u.fid,
              username: u.username,
              displayName: u.displayName,
              pfpUrl: u.pfpUrl,
            };
          }
        } catch {
          // コンテキスト取得不可
        }

        setState({ isInMiniApp: true, isLoading: false, user });
      })
      .catch(() => {
        setState({ isInMiniApp: false, isLoading: false, user: null });
      });
  }, []);

  return state;
}
