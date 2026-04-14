'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useFarcasterMiniApp } from '@/lib/farcaster';
import {
  fetchTxList,
  fetchTotalTxCount,
  analyzeSins,
  generateConfessions,
  calcSinScore,
  type WalletSins,
  type Confession,
} from '@/lib/blockscout';
import { ConfessionCard } from '@/components/ConfessionCard';

type Phase = 'connect' | 'loading' | 'result' | 'error';

export default function Home() {
  const { isInMiniApp, isLoading: fcLoading, user } = useFarcasterMiniApp();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [phase, setPhase] = useState<Phase>('connect');
  const [sins, setSins] = useState<WalletSins | null>(null);
  const [confessions, setConfessions] = useState<Confession[]>([]);
  // Farcaster: farcasterWallet のみ表示。ブラウザ: それ以外を表示
  const visibleConnectors = isInMiniApp
    ? connectors.filter((c) => c.id === 'farcasterWallet')
    : connectors.filter((c) => c.id !== 'farcasterWallet');

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://base-confessional.vercel.app';

  const walletName = (id: string) => {
    if (id === 'injected') return isInMiniApp ? 'Farcaster Wallet' : 'Browser Wallet';
    if (id === 'coinbaseWalletSDK') return 'Coinbase Wallet';
    if (id === 'walletConnect') return 'WalletConnect';
    return id;
  };

  const handleConnect = (connector: (typeof connectors)[number]) => {
    connect({ connector });
  };

  const handleAnalyze = async () => {
    if (!address) return;
    setPhase('loading');
    try {
      const [txs, totalCount] = await Promise.all([
        fetchTxList(address),
        fetchTotalTxCount(address),
      ]);
      const s = analyzeSins(txs, address, totalCount ?? undefined);
      const c = generateConfessions(s);
      setSins(s);
      setConfessions(c);
      setPhase('result');
    } catch {
      setPhase('error');
    }
  };

  const handleShare = () => {
    if (!sins) return;
    const score = calcSinScore(sins);
    const text = `I confessed my on-chain sins on Base Confessional.\nSin score: ${score}/100... come judge me.`;
    const shareUrl = `${appUrl}`;
    const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(shareUrl)}`;
    if (isInMiniApp) {
      import('@farcaster/miniapp-sdk').then(({ sdk }) => {
        sdk.actions.openUrl(composeUrl);
      });
    } else {
      window.open(composeUrl, '_blank');
    }
  };

  // Farcaster SDK ローディング中
  if (fcLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-4 h-4 border border-paper/20 border-t-paper/60 rounded-full animate-spin" />
      </main>
    );
  }

  // ウォレット接続済みかつ未分析
  if (isConnected && phase === 'connect') {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 space-y-10">
        <Header />
        <div className="w-full max-w-[360px] space-y-6 reveal-up" style={{ animationDelay: '0.3s' }}>
          <div className="border border-muted p-5 space-y-4">
            <p className="text-[9px] tracking-widest3 uppercase text-dim">
              Connected
            </p>
            <p className="font-mono text-xs text-paper/60 break-all">{address}</p>
          </div>
          <button
            onClick={handleAnalyze}
            className="w-full py-3.5 text-[11px] tracking-widest2 uppercase border border-paper/30 text-paper/80 hover:border-paper/60 hover:text-paper active:scale-[0.98] transition-all duration-300"
          >
            Begin Confession
          </button>
          <button
            onClick={() => disconnect()}
            className="w-full py-2 text-[9px] tracking-widest2 uppercase text-dim/50 hover:text-dim transition-colors"
          >
            Disconnect
          </button>
        </div>
      </main>
    );
  }

  // 分析中
  if (phase === 'loading') {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 space-y-6">
        <div className="space-y-4 text-center reveal-fade">
          <div className="w-4 h-4 border border-paper/20 border-t-paper/60 rounded-full animate-spin mx-auto" />
          <p className="text-[10px] tracking-widest2 uppercase text-dim">
            Reading your sins...
          </p>
          <p className="text-[9px] text-dim/40">Fetching transaction history from Base</p>
        </div>
      </main>
    );
  }

  // エラー
  if (phase === 'error') {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 space-y-6">
        <div className="text-center space-y-4 reveal-fade">
          <p className="text-xs tracking-widest2 uppercase text-paper/60">
            Something went wrong
          </p>
          <p className="text-[9px] text-dim/60">
            The confession booth is temporarily unavailable.
          </p>
          <button
            onClick={() => setPhase('connect')}
            className="text-[10px] tracking-widest2 uppercase text-dim border-b border-dim/30 hover:border-dim/60 transition-colors"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  // 結果表示
  if (phase === 'result' && sins) {
    return (
      <main className="min-h-dvh flex flex-col items-center px-6 py-16 pb-24">
        <ConfessionCard
          address={address!}
          sins={sins}
          confessions={confessions}
          displayName={user?.displayName ?? user?.username}
          onShare={handleShare}
        />
        <button
          onClick={() => { setPhase('connect'); setSins(null); setConfessions([]); }}
          className="mt-10 text-[9px] tracking-widest2 uppercase text-dim/40 hover:text-dim/70 transition-colors"
        >
          Reset
        </button>
      </main>
    );
  }

  // 接続画面（デフォルト）
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 space-y-12">
      <Header />

      {/* コネクターリスト */}
      <div className="w-full max-w-[360px] space-y-3 reveal-up" style={{ animationDelay: '0.35s' }}>
        {visibleConnectors.map((c) => (
          <button
            key={c.id}
            onClick={() => handleConnect(c)}
            className="
              w-full py-3.5 text-[11px] tracking-widest2 uppercase
              border border-paper/15 text-paper/60
              hover:border-paper/40 hover:text-paper/90
              active:scale-[0.98] transition-all duration-300
            "
          >
            {walletName(c.id)}
          </button>
        ))}
      </div>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <div className="text-center space-y-5 reveal-fade">
      <p className="text-[9px] tracking-widest3 uppercase text-dim">
        Base &middot; Mainnet
      </p>
      <div className="space-y-1">
        <h1 className="text-2xl tracking-tight text-paper font-light">
          Base Confessional
        </h1>
        <p className="text-[11px] text-dim italic">
          Your wallet has sins. Time to confess them.
        </p>
      </div>
      <div className="h-px w-12 bg-muted mx-auto line-grow" />
    </div>
  );
}

function Footer() {
  return (
    <p
      className="text-[9px] text-dim/30 text-center max-w-[280px] reveal-fade"
      style={{ animationDelay: '0.5s' }}
    >
      Transaction data sourced from Base Mainnet via Blockscout.
      <br />
      No data is stored. Connect at your own moral risk.
    </p>
  );
}
