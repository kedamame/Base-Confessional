'use client';

import { type Confession, type WalletSins, calcSinScore, sinLabel } from '@/lib/blockscout';

interface ConfessionCardProps {
  address: string;
  sins: WalletSins;
  confessions: Confession[];
  displayName?: string;
  onShare: () => void;
}

const severityAccent: Record<string, string> = {
  minor:    'border-l-[#8a7f78]',
  moderate: 'border-l-[#c8b89a]',
  grave:    'border-l-[#e8d0b0]',
};

function SinMeter({ score }: { score: number }) {
  const { ja, color } = sinLabel(score);
  const pct = `${score}%`;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <span className="text-[9px] tracking-widest3 uppercase text-dim">
          Sin Level
        </span>
        <span className="text-xs font-mono text-paper/60">{score}/100</span>
      </div>
      {/* プログレスバー */}
      <div className="h-px w-full bg-muted relative overflow-hidden">
        <div
          className="h-full absolute left-0 top-0 line-grow"
          style={{ width: pct, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between items-baseline">
        <span className="text-xs italic text-accent">{ja}</span>
        <span className="text-[9px] tracking-widest2 uppercase" style={{ color }}>
          {sinLabel(score).label}
        </span>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-muted">
      <span className="text-[9px] tracking-widest2 uppercase text-dim">{label}</span>
      <span className="text-xs font-mono text-paper/70">{value}</span>
    </div>
  );
}

export function ConfessionCard({
  address,
  sins,
  confessions,
  displayName,
  onShare,
}: ConfessionCardProps) {
  const score = calcSinScore(sins);
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="w-full max-w-[360px] mx-auto space-y-8">

      {/* ヘッダー */}
      <div className="space-y-4 reveal-fade" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-muted line-grow" />
          <span className="text-[9px] tracking-widest3 uppercase text-dim px-2">
            Confessional
          </span>
          <div className="h-px flex-1 bg-muted line-grow" style={{ animationDelay: '0.1s' }} />
        </div>
        <div className="text-center">
          <p className="text-[10px] tracking-widest2 uppercase text-dim">
            {displayName ?? shortAddr}
          </p>
          {displayName && (
            <p className="text-[9px] font-mono text-dim/50 mt-0.5">{shortAddr}</p>
          )}
        </div>
      </div>

      {/* 懺悔リスト */}
      <div className="space-y-4">
        {confessions.map((c, i) => (
          <div
            key={i}
            className={`border-l-2 pl-4 reveal-up ${severityAccent[c.severity]}`}
            style={{ animationDelay: `${0.2 + i * 0.18}s` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-base leading-none mt-0.5 shrink-0">{c.icon}</span>
              <p className="text-[13px] leading-relaxed text-paper/80">
                {c.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* セパレーター */}
      <div
        className="h-px bg-muted line-grow reveal-fade"
        style={{ animationDelay: `${0.2 + confessions.length * 0.18}s` }}
      />

      {/* Sin スコア */}
      <div
        className="reveal-up"
        style={{ animationDelay: `${0.35 + confessions.length * 0.18}s` }}
      >
        <SinMeter score={score} />
      </div>

      {/* 統計 */}
      <div
        className="reveal-up"
        style={{ animationDelay: `${0.5 + confessions.length * 0.18}s` }}
      >
        <p className="text-[9px] tracking-widest3 uppercase text-dim mb-3">
          The Record
        </p>
        <StatRow label="Total TX"       value={sins.totalTxCount.toString()} />
        <div className="h-px bg-muted/50 my-2" />
        <p className="text-[8px] text-dim/40 italic mb-2">
          Based on latest 100 transactions
        </p>
        <StatRow label="Gas Burned"     value={`${sins.totalGasEth.toFixed(5)} ETH`} />
        <StatRow label="Contract Calls" value={sins.contractCalls.toString()} />
        <StatRow label="Deployments"    value={sins.contractDeploys.toString()} />
        <StatRow label="Night TX"       value={sins.nightTxCount.toString()} />
        <StatRow label="Failed TX"      value={sins.failedTxCount.toString()} />
        <StatRow
          label="Days Inactive"
          value={sins.daysSinceLastTx === 9999 ? '—' : `${sins.daysSinceLastTx}`}
        />
        <StatRow
          label="Wallet Age"
          value={sins.walletAgeDays === 0 ? 'New' : `${sins.walletAgeDays}d`}
        />
      </div>

      {/* シェアボタン */}
      <div
        className="reveal-up"
        style={{ animationDelay: `${0.65 + confessions.length * 0.18}s` }}
      >
        <button
          onClick={onShare}
          className="
            w-full py-3.5 text-[11px] tracking-widest2 uppercase
            border border-paper/20 text-paper/70
            hover:border-paper/50 hover:text-paper
            active:scale-[0.98] transition-all duration-300
          "
        >
          Confess on Farcaster
        </button>
        <p className="text-center text-[9px] text-dim/40 italic mt-3">
          Based on Base Mainnet data &middot; No absolution guaranteed.
        </p>
      </div>

    </div>
  );
}
