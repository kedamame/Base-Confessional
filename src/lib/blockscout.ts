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
  severity: 'minor' | 'moderate' | 'grave'; // 罪の重さ
};

export function generateConfessions(sins: WalletSins): Confession[] {
  const confessions: Confession[] = [];

  // ガス代の懺悔
  if (sins.totalGasEth > 0) {
    const meals = Math.round(sins.totalGasUsd / 12);
    if (sins.totalGasEth > 0.1) {
      confessions.push({
        icon: '🔥',
        text: `私は ${sins.totalGasEth.toFixed(4)} ETH（約$${sins.totalGasUsd.toFixed(0)}）をガス代に捧げました。${meals}回の食事分です。私は後悔していません。本当です。`,
        severity: 'grave',
      });
    } else if (sins.totalGasEth > 0.01) {
      confessions.push({
        icon: '⛽',
        text: `私は ${sins.totalGasEth.toFixed(4)} ETH をガス代として燃やしました。Block Producerへの献金と思えば気が楽になります。`,
        severity: 'moderate',
      });
    } else {
      confessions.push({
        icon: '💸',
        text: `私は ${(sins.totalGasEth * 1e6).toFixed(0)} μETH をガスとして支払いました。まだ罪は軽い方です。`,
        severity: 'minor',
      });
    }
  }

  // 放置の懺悔
  if (sins.daysSinceLastTx > 180) {
    confessions.push({
      icon: '👻',
      text: `最後にBase上で動いてから ${sins.daysSinceLastTx} 日が経過しています。私はゴーストです。Baseは私を覚えていません。`,
      severity: 'grave',
    });
  } else if (sins.daysSinceLastTx > 30) {
    confessions.push({
      icon: '😴',
      text: `${sins.daysSinceLastTx} 日間、私はオンチェーン活動を休止しています。「準備中」と言い聞かせています。`,
      severity: 'moderate',
    });
  } else if (sins.daysSinceLastTx > 7) {
    confessions.push({
      icon: '🌙',
      text: `最後のTXから ${sins.daysSinceLastTx} 日が経ちました。週1のペースを「適度」と呼ぶことにします。`,
      severity: 'minor',
    });
  }

  // 深夜活動の懺悔
  if (sins.nightTxCount > 10) {
    confessions.push({
      icon: '🕯️',
      text: `私のTXのうち ${sins.nightTxCount} 件は深夜0〜5時台に実行されました。Baseは眠りません。私も眠りません。それで良かったかは分かりません。`,
      severity: 'grave',
    });
  } else if (sins.nightTxCount > 3) {
    confessions.push({
      icon: '🌃',
      text: `${sins.nightTxCount} 件の深夜TXを告白します。夜に判断力が下がることは医学的に証明されています。`,
      severity: 'moderate',
    });
  }

  // 失敗TXの懺悔
  if (sins.failedTxCount > 5) {
    confessions.push({
      icon: '💀',
      text: `私は ${sins.failedTxCount} 件のトランザクションを失敗させました。ガス代だけが消えました。これは学習です。`,
      severity: 'grave',
    });
  } else if (sins.failedTxCount > 0) {
    confessions.push({
      icon: '❌',
      text: `${sins.failedTxCount} 件のTXがエラーで終わりました。ガスだけ払って何も起きない体験を知っています。`,
      severity: 'moderate',
    });
  }

  // 誰にも使われないコントラクトの懺悔
  if (sins.contractDeploys > 2) {
    confessions.push({
      icon: '🏚️',
      text: `私は ${sins.contractDeploys} 個のコントラクトをデプロイしました。それらが今も呼ばれているかは確認していません。知らぬが仏。`,
      severity: 'moderate',
    });
  } else if (sins.contractDeploys === 1) {
    confessions.push({
      icon: '🔮',
      text: `私のコントラクトは静かにBlockchainの上に存在しています。誰かが使う日を信じています。`,
      severity: 'minor',
    });
  }

  // 自己送金の懺悔
  if (sins.selfSends > 0) {
    confessions.push({
      icon: '🪞',
      text: `自分自身のウォレットに ${sins.selfSends} 回ETHを送りました。テストのためです。本当です。楽しんではいません。`,
      severity: 'minor',
    });
  }

  // ベテランの懺悔
  if (sins.walletAgeDays > 365 && sins.totalTxCount < 20) {
    confessions.push({
      icon: '🧓',
      text: `このウォレットは ${sins.walletAgeDays} 日前から存在しますが、TXはわずか ${sins.totalTxCount} 件です。時が経つのは早い。`,
      severity: 'moderate',
    });
  }

  // ガスを使いすぎる一回のTX
  if (sins.biggestGasTx > 0.01) {
    confessions.push({
      icon: '💣',
      text: `私の最大ガス消費TXは ${sins.biggestGasTx.toFixed(4)} ETH でした。あの日何が起きたかは覚えています。後悔はしていません（少しだけしています）。`,
      severity: 'grave',
    });
  }

  // 初心者/全員への普遍的な懺悔（常に最低1つ追加）
  if (confessions.length === 0 || sins.totalTxCount === 0) {
    confessions.push({
      icon: '🌿',
      text: `私はまだBase上でほとんど何もしていません。これ自体が告白です。全ての旅は一歩から始まります。`,
      severity: 'minor',
    });
  }

  // 最大4件まで返す
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
