const BLOCKSCOUT    = 'https://base.blockscout.com/api';
const BLOCKSCOUT_V2 = 'https://base.blockscout.com/api/v2';

export type Tx = {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  timeStamp: string;
  input: string;
  isError: string;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/** 直近100件のTX一覧（ガス計算・パターン分析用） */
export async function fetchTxList(address: string): Promise<Tx[]> {
  const result = await withTimeout(
    fetch(
      `${BLOCKSCOUT}?module=account&action=txlist&address=${address}&page=1&offset=100&sort=desc`,
      { cache: 'no-store' },
    )
      .then((r) => r.text())
      .then((text) => {
        const json = JSON.parse(text) as { status?: string; result?: Tx[] };
        if (json.status !== '1' || !Array.isArray(json.result)) return [];
        return json.result;
      }),
    8000,
  );
  return result ?? [];
}

/** Blockscout v2 API でアドレスの実際の総TX数を取得 */
export async function fetchTotalTxCount(address: string): Promise<number | null> {
  const result = await withTimeout(
    fetch(`${BLOCKSCOUT_V2}/addresses/${address}`, { cache: 'no-store' })
      .then((r) => r.text())
      .then((text) => {
        const json = JSON.parse(text) as { transaction_count?: number };
        return typeof json.transaction_count === 'number'
          ? json.transaction_count
          : null;
      }),
    5000,
  );
  return result ?? null;
}

// ---------- 罪の解析 ----------

export type WalletSins = {
  totalTxCount: number;
  totalGasEth: number;           // ETH単位
  totalGasUsd: number;           // USD換算(概算)
  daysSinceLastTx: number;
  walletAgeDays: number;
  contractCalls: number;
  contractDeploys: number;
  nightTxCount: number;          // UTC 0-5時台のTX
  failedTxCount: number;
  selfSends: number;             // 自分自身へのETH送信
  avgGasPerTx: number;
  biggestGasTx: number;          // 最大ガス代(ETH)
};

function weiToEth(wei: bigint): number {
  return Number(wei) / 1e18;
}

const ETH_PRICE_USD = 1800; // 概算 — OGには使わないので固定値でOK

/** totalTxCount: v2 APIで取得した実際の総数を渡す。未取得時は txs.length にフォールバック */
export function analyzeSins(txs: Tx[], address: string, totalTxCount?: number): WalletSins {
  if (txs.length === 0) {
    return {
      totalTxCount: totalTxCount ?? 0,
      totalGasEth: 0,
      totalGasUsd: 0,
      daysSinceLastTx: 9999,
      walletAgeDays: 0,
      contractCalls: 0,
      contractDeploys: 0,
      nightTxCount: 0,
      failedTxCount: 0,
      selfSends: 0,
      avgGasPerTx: 0,
      biggestGasTx: 0,
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const addr = address.toLowerCase();

  const latestTs = parseInt(txs[0].timeStamp, 10);
  const oldestTs = parseInt(txs[txs.length - 1].timeStamp, 10);

  let totalGasWei = BigInt(0);
  let biggestGasWei = BigInt(0);
  let contractCalls = 0;
  let contractDeploys = 0;
  let nightTxCount = 0;
  let failedTxCount = 0;
  let selfSends = 0;

  for (const tx of txs) {
    const gasWei =
      BigInt(tx.gasUsed || '0') * BigInt(tx.gasPrice || '0');
    totalGasWei += gasWei;
    if (gasWei > biggestGasWei) biggestGasWei = gasWei;

    if (!tx.to) {
      contractDeploys++;
    } else if (tx.input && tx.input !== '0x') {
      contractCalls++;
    }

    const hour = new Date(parseInt(tx.timeStamp, 10) * 1000).getUTCHours();
    if (hour >= 0 && hour < 5) nightTxCount++;

    if (tx.isError === '1') failedTxCount++;

    if (
      tx.to?.toLowerCase() === addr &&
      tx.from?.toLowerCase() === addr
    ) {
      selfSends++;
    }
  }

  const totalGasEth = weiToEth(totalGasWei);

  return {
    totalTxCount: totalTxCount ?? txs.length,
    totalGasEth,
    totalGasUsd: totalGasEth * ETH_PRICE_USD,
    daysSinceLastTx: Math.floor((now - latestTs) / 86400),
    walletAgeDays: Math.floor((now - oldestTs) / 86400),
    contractCalls,
    contractDeploys,
    nightTxCount,
    failedTxCount,
    selfSends,
    avgGasPerTx: txs.length > 0 ? totalGasEth / txs.length : 0,
    biggestGasTx: weiToEth(biggestGasWei),
  };
}

// ---------- 懺悔文生成 ----------

export type Confession = {
  icon: string;
  text: string;
  severity: 'minor' | 'moderate' | 'grave';
};

type ConfessionTexts = {
  gasGrave:       (eth: string, usd: string, meals: number) => string;
  gasModerate:    (eth: string) => string;
  gasMinor:       (micro: string) => string;
  ghostGrave:     (days: number) => string;
  ghostModerate:  (days: number) => string;
  ghostMinor:     (days: number) => string;
  nightGrave:     (n: number) => string;
  nightModerate:  (n: number) => string;
  failGrave:      (n: number) => string;
  failModerate:   (n: number) => string;
  deployModerate: (n: number) => string;
  deployMinor:    () => string;
  selfSend:       (n: number) => string;
  veteran:        (days: number, txs: number) => string;
  bigGas:         (eth: string) => string;
  newbie:         () => string;
};

const confessionTexts: Record<'en' | 'ja', ConfessionTexts> = {
  en: {
    gasGrave:       (eth, usd, meals) => `I have sacrificed ${eth} ETH (~$${usd}) to gas fees. That's ${meals} meals. I don't regret it. I really don't.`,
    gasModerate:    (eth) => `I burned ${eth} ETH in gas. Think of it as a donation to block producers.`,
    gasMinor:       (micro) => `I paid ${micro} μETH in gas. Still a sinner, just a minor one.`,
    ghostGrave:     (days) => `It has been ${days} days since my last on-chain activity. I am a ghost. Base has forgotten me.`,
    ghostModerate:  (days) => `${days} days without a transaction. I keep telling myself I'm "just preparing."`,
    ghostMinor:     (days) => `${days} days since my last TX. I'm calling it a weekly cadence.`,
    nightGrave:     (n) => `${n} of my transactions were sent between midnight and 5am. Base never sleeps. Neither do I. Whether that was wise is unclear.`,
    nightModerate:  (n) => `I confess to ${n} midnight transactions. Science confirms judgment worsens at night.`,
    failGrave:      (n) => `I failed ${n} transactions. Only gas was consumed. This is called learning.`,
    failModerate:   (n) => `${n} transactions ended in error. I know the feeling of paying gas and getting nothing.`,
    deployModerate: (n) => `I deployed ${n} contracts. Whether they are still being called — I choose not to check. Ignorance is peace.`,
    deployMinor:    () => `My contract exists quietly on the blockchain. Someone will use it someday. I believe this.`,
    selfSend:       (n) => `I sent ETH to myself ${n} time(s). It was for testing. Truly. I did not enjoy it.`,
    veteran:        (days, txs) => `This wallet has existed for ${days} days, yet has only ${txs} transactions. Time flies.`,
    bigGas:         (eth) => `My single largest gas cost was ${eth} ETH. I remember that day. I have no regrets (mostly).`,
    newbie:         () => `I have barely done anything on Base yet. That itself is a confession. Every journey begins with one step.`,
  },
  ja: {
    gasGrave:       (eth, usd, meals) => `私は ${eth} ETH（約$${usd}）をガス代に捧げました。${meals}回の食事分です。私は後悔していません。本当です。`,
    gasModerate:    (eth) => `私は ${eth} ETH をガス代として燃やしました。Block Producerへの献金と思えば気が楽になります。`,
    gasMinor:       (micro) => `私は ${micro} μETH をガスとして支払いました。まだ罪は軽い方です。`,
    ghostGrave:     (days) => `最後にBase上で動いてから ${days} 日が経過しています。私はゴーストです。Baseは私を覚えていません。`,
    ghostModerate:  (days) => `${days} 日間、私はオンチェーン活動を休止しています。「準備中」と言い聞かせています。`,
    ghostMinor:     (days) => `最後のTXから ${days} 日が経ちました。週1のペースを「適度」と呼ぶことにします。`,
    nightGrave:     (n) => `私のTXのうち ${n} 件は深夜0〜5時台に実行されました。Baseは眠りません。私も眠りません。それで良かったかは分かりません。`,
    nightModerate:  (n) => `${n} 件の深夜TXを告白します。夜に判断力が下がることは医学的に証明されています。`,
    failGrave:      (n) => `私は ${n} 件のトランザクションを失敗させました。ガス代だけが消えました。これは学習です。`,
    failModerate:   (n) => `${n} 件のTXがエラーで終わりました。ガスだけ払って何も起きない体験を知っています。`,
    deployModerate: (n) => `私は ${n} 個のコントラクトをデプロイしました。それらが今も呼ばれているかは確認していません。知らぬが仏。`,
    deployMinor:    () => `私のコントラクトは静かにBlockchainの上に存在しています。誰かが使う日を信じています。`,
    selfSend:       (n) => `自分自身のウォレットに ${n} 回ETHを送りました。テストのためです。本当です。楽しんではいません。`,
    veteran:        (days, txs) => `このウォレットは ${days} 日前から存在しますが、TXはわずか ${txs} 件です。時が経つのは早い。`,
    bigGas:         (eth) => `私の最大ガス消費TXは ${eth} ETH でした。あの日何が起きたかは覚えています。後悔はしていません（少しだけしています）。`,
    newbie:         () => `私はまだBase上でほとんど何もしていません。これ自体が告白です。全ての旅は一歩から始まります。`,
  },
};

export function generateConfessions(sins: WalletSins, lang: 'en' | 'ja' = 'en'): Confession[] {
  const c = confessionTexts[lang];
  const confessions: Confession[] = [];

  if (sins.totalGasEth > 0) {
    const meals = Math.round(sins.totalGasUsd / 12);
    if (sins.totalGasEth > 0.1) {
      confessions.push({ icon: '🔥', severity: 'grave',
        text: c.gasGrave(sins.totalGasEth.toFixed(4), sins.totalGasUsd.toFixed(0), meals) });
    } else if (sins.totalGasEth > 0.01) {
      confessions.push({ icon: '⛽', severity: 'moderate',
        text: c.gasModerate(sins.totalGasEth.toFixed(4)) });
    } else {
      confessions.push({ icon: '💸', severity: 'minor',
        text: c.gasMinor((sins.totalGasEth * 1e6).toFixed(0)) });
    }
  }

  if (sins.daysSinceLastTx > 180) {
    confessions.push({ icon: '👻', severity: 'grave',    text: c.ghostGrave(sins.daysSinceLastTx) });
  } else if (sins.daysSinceLastTx > 30) {
    confessions.push({ icon: '😴', severity: 'moderate', text: c.ghostModerate(sins.daysSinceLastTx) });
  } else if (sins.daysSinceLastTx > 7) {
    confessions.push({ icon: '🌙', severity: 'minor',    text: c.ghostMinor(sins.daysSinceLastTx) });
  }

  if (sins.nightTxCount > 10) {
    confessions.push({ icon: '🕯️', severity: 'grave',    text: c.nightGrave(sins.nightTxCount) });
  } else if (sins.nightTxCount > 3) {
    confessions.push({ icon: '🌃', severity: 'moderate', text: c.nightModerate(sins.nightTxCount) });
  }

  if (sins.failedTxCount > 5) {
    confessions.push({ icon: '💀', severity: 'grave',    text: c.failGrave(sins.failedTxCount) });
  } else if (sins.failedTxCount > 0) {
    confessions.push({ icon: '❌', severity: 'moderate', text: c.failModerate(sins.failedTxCount) });
  }

  if (sins.contractDeploys > 2) {
    confessions.push({ icon: '🏚️', severity: 'moderate', text: c.deployModerate(sins.contractDeploys) });
  } else if (sins.contractDeploys === 1) {
    confessions.push({ icon: '🔮', severity: 'minor',    text: c.deployMinor() });
  }

  if (sins.selfSends > 0) {
    confessions.push({ icon: '🪞', severity: 'minor',    text: c.selfSend(sins.selfSends) });
  }

  if (sins.walletAgeDays > 365 && sins.totalTxCount < 20) {
    confessions.push({ icon: '🧓', severity: 'moderate', text: c.veteran(sins.walletAgeDays, sins.totalTxCount) });
  }

  if (sins.biggestGasTx > 0.01) {
    confessions.push({ icon: '💣', severity: 'grave',    text: c.bigGas(sins.biggestGasTx.toFixed(4)) });
  }

  if (confessions.length === 0 || sins.totalTxCount === 0) {
    confessions.push({ icon: '🌿', severity: 'minor',    text: c.newbie() });
  }

  return confessions.slice(0, 4);
}

// 罪スコアの計算 (0-100)
export function calcSinScore(sins: WalletSins): number {
  let score = 0;
  score += Math.min(sins.totalGasEth * 500, 30);      // ガス代 max 30pt
  score += Math.min(sins.nightTxCount * 3, 20);        // 深夜活動 max 20pt
  score += Math.min(sins.failedTxCount * 5, 15);       // 失敗TX max 15pt
  score += Math.min(sins.contractDeploys * 5, 15);     // デプロイ max 15pt
  score += sins.daysSinceLastTx > 90 ? 10 : 0;        // 放置 10pt
  score += sins.selfSends > 0 ? 5 : 0;                // 自己送金 5pt
  score += Math.min(sins.biggestGasTx * 1000, 5);     // 最大ガス max 5pt
  return Math.min(Math.round(score), 100);
}

// 罪スコアに対するレッテル
export function sinLabel(score: number): {
  label: string;
  ja: string;
  color: string;
} {
  if (score >= 80)
    return { label: 'Arch Sinner', ja: '大罪人', color: '#ef4444' };
  if (score >= 60)
    return { label: 'Moderate Sinner', ja: '常習犯', color: '#f97316' };
  if (score >= 40)
    return { label: 'Occasional Sinner', ja: '軽度の罪人', color: '#eab308' };
  if (score >= 20)
    return { label: 'Mostly Innocent', ja: 'ほぼ無実', color: '#84cc16' };
  return { label: 'Pure Soul', ja: '清廉な魂', color: '#22c55e' };
}
