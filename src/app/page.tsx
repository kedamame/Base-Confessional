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
} from '@/lib/blockscout';
import { ConfessionCard } from '@/components/ConfessionCard';
import { t, type Lang } from '@/lib/i18n';

type Phase = 'connect' | 'loading' | 'result' | 'error';

export default function Home() {
  const { isInMiniApp, isLoading: fcLoading, user } = useFarcasterMiniApp();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [phase, setPhase] = useState<Phase>('connect');
  const [sins, setSins]   = useState<WalletSins | null>(null);
  const [lang, setLang]   = useState<Lang>('en');

  // Derive confessions from sins + lang so they update when language changes
  const confessions = sins ? generateConfessions(sins, lang) : [];

  const tx = t[lang];

  // Farcaster: farcasterWallet のみ表示。ブラウザ: それ以外を表示
  const visibleConnectors = isInMiniApp
    ? connectors.filter((c) => c.id === 'farcasterWallet')
    : connectors.filter((c) => c.id !== 'farcasterWallet');

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://base-confessional.vercel.app';

  const walletName = (id: string) => {
    if (id === 'farcasterWallet') return tx.walletFarcaster;
    if (id === 'injected')        return tx.walletBrowser;
    if (id === 'coinbaseWalletSDK') return tx.walletCoinbase;
    if (id === 'walletConnect')   return tx.walletConnect;
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
      setSins(s);
      setPhase('result');
    } catch {
      setPhase('error');
    }
  };

  const handleShare = () => {
    if (!sins) return;
    const score = calcSinScore(sins);
    const text = lang === 'ja'
      ? `Base 懺悔室でオンチェーンの罪を告白しました。\n罪スコア: ${score}/100... 裁いてください。`
      : `I confessed my on-chain sins on Base Confessional.\nSin score: ${score}/100... come judge me.`;
    const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(appUrl)}`;
    if (isInMiniApp) {
      import('@farcaster/miniapp-sdk').then(({ sdk }) => {
        sdk.actions.openUrl(composeUrl);
      });
    } else {
      window.open(composeUrl, '_blank');
    }
  };

  const LangToggle = () => (
    <button
      onClick={() => setLang((l) => l === 'en' ? 'ja' : 'en')}
      className="fixed top-4 right-4 text-[9px] tracking-widest2 uppercase text-dim/50 hover:text-dim border border-dim/20 hover:border-dim/40 px-2 py-1 transition-all z-10"
    >
      {lang === 'en' ? 'JA' : 'EN'}
    </button>
  );

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
        <LangToggle />
        <Header lang={lang} />
        <div className="w-full max-w-[360px] space-y-6 reveal-up" style={{ animationDelay: '0.3s' }}>
          <div className="border border-muted p-5 space-y-4">
            <p className="text-[9px] tracking-widest3 uppercase text-dim">
              {tx.connected}
            </p>
            <p className="font-mono text-xs text-paper/60 break-all">{address}</p>
          </div>
          <button
            onClick={handleAnalyze}
            className="w-full py-3.5 text-[11px] tracking-widest2 uppercase border border-paper/30 text-paper/80 hover:border-paper/60 hover:text-paper active:scale-[0.98] transition-all duration-300"
          >
            {tx.beginConfession}
          </button>
          <button
            onClick={() => disconnect()}
            className="w-full py-2 text-[9px] tracking-widest2 uppercase text-dim/50 hover:text-dim transition-colors"
          >
            {tx.disconnect}
          </button>
        </div>
      </main>
    );
  }

  // 分析中
  if (phase === 'loading') {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 space-y-6">
        <LangToggle />
        <div className="space-y-4 text-center reveal-fade">
          <div className="w-4 h-4 border border-paper/20 border-t-paper/60 rounded-full animate-spin mx-auto" />
          <p className="text-[10px] tracking-widest2 uppercase text-dim">
            {tx.loadingTitle}
          </p>
          <p className="text-[9px] text-dim/40">{tx.loadingBody}</p>
        </div>
      </main>
    );
  }

  // エラー
  if (phase === 'error') {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 space-y-6">
        <LangToggle />
        <div className="text-center space-y-4 reveal-fade">
          <p className="text-xs tracking-widest2 uppercase text-paper/60">
            {tx.errorTitle}
          </p>
          <p className="text-[9px] text-dim/60">{tx.errorBody}</p>
          <button
            onClick={() => setPhase('connect')}
            className="text-[10px] tracking-widest2 uppercase text-dim border-b border-dim/30 hover:border-dim/60 transition-colors"
          >
            {tx.tryAgain}
          </button>
        </div>
      </main>
    );
  }

  // 結果表示
  if (phase === 'result' && sins) {
    return (
      <main className="min-h-dvh flex flex-col items-center px-6 py-16 pb-24">
        <LangToggle />
        <ConfessionCard
          address={address!}
          sins={sins}
          confessions={confessions}
          displayName={user?.displayName ?? user?.username}
          lang={lang}
          onShare={handleShare}
        />
        <button
          onClick={() => { setPhase('connect'); setSins(null); }}
          className="mt-10 text-[9px] tracking-widest2 uppercase text-dim/40 hover:text-dim/70 transition-colors"
        >
          {tx.reset}
        </button>
      </main>
    );
  }

  // 接続画面（デフォルト）
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 space-y-12">
      <LangToggle />
      <Header lang={lang} />

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

      <Footer lang={lang} />
    </main>
  );
}

function Header({ lang }: { lang: Lang }) {
  const tx = t[lang];
  return (
    <div className="text-center space-y-5 reveal-fade">
      <p className="text-[9px] tracking-widest3 uppercase text-dim">
        {tx.network}
      </p>
      <div className="space-y-1">
        <h1 className="text-2xl tracking-tight text-paper font-light">
          {tx.appName}
        </h1>
        <p className="text-[11px] text-dim italic">
          {tx.tagline}
        </p>
      </div>
      <div className="h-px w-12 bg-muted mx-auto line-grow" />
    </div>
  );
}

function Footer({ lang }: { lang: Lang }) {
  const tx = t[lang];
  return (
    <p
      className="text-[9px] text-dim/30 text-center max-w-[280px] reveal-fade"
      style={{ animationDelay: '0.5s' }}
    >
      {tx.footer1}
      <br />
      {tx.footer2}
    </p>
  );
}
