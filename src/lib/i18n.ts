export type Lang = 'en' | 'ja';

export const t = {
  en: {
    // Header
    network:      'Base · Mainnet',
    appName:      'Base Confessional',
    tagline:      'Your wallet has sins. Time to confess them.',

    // Connect screen
    walletFarcaster:  'Farcaster Wallet',
    walletBrowser:    'Browser Wallet',
    walletCoinbase:   'Coinbase Wallet',
    walletConnect:    'WalletConnect',
    connected:        'Connected',
    beginConfession:  'Begin Confession',
    disconnect:       'Disconnect',
    footer1:          'Transaction data sourced from Base Mainnet via Blockscout.',
    footer2:          'No data is stored. Connect at your own moral risk.',

    // Loading / error
    loadingTitle: 'Reading your sins...',
    loadingBody:  'Fetching transaction history from Base',
    errorTitle:   'Something went wrong',
    errorBody:    'The confession booth is temporarily unavailable.',
    tryAgain:     'Try again',
    reset:        'Reset',

    // ConfessionCard
    confessionOf:    'Confession of',
    iConfess:        'I Confess...',
    sinLevel:        'Sin Level',
    theRecord:       'The Record',
    latest100:       'Based on latest 100 transactions',
    shareButton:     'Confess on Farcaster',
    disclaimer:      'Based on Base Mainnet data · No absolution guaranteed.',

    // Stats labels
    statTotalTx:    'Total TX',
    statGas:        'Gas Burned',
    statCalls:      'Contract Calls',
    statDeploys:    'Deployments',
    statNight:      'Night TX',
    statFailed:     'Failed TX',
    statInactive:   'Days Inactive',
    statAge:        'Wallet Age',

    // Sin labels
    sinArchSinner:      'Arch Sinner',
    sinModerate:        'Moderate Sinner',
    sinOccasional:      'Occasional Sinner',
    sinMostly:          'Mostly Innocent',
    sinPure:            'Pure Soul',
  },
  ja: {
    // Header
    network:      'Base · メインネット',
    appName:      'Base 懺悔室',
    tagline:      'あなたのウォレットには罪がある。告白の時だ。',

    // Connect screen
    walletFarcaster:  'Farcasterウォレット',
    walletBrowser:    'ブラウザウォレット',
    walletCoinbase:   'Coinbase Wallet',
    walletConnect:    'WalletConnect',
    connected:        '接続済み',
    beginConfession:  '懺悔を始める',
    disconnect:       '切断',
    footer1:          'トランザクションデータはBlockscoutより取得しています。',
    footer2:          'データは保存されません。自己責任でどうぞ。',

    // Loading / error
    loadingTitle: '罪を読み取っています...',
    loadingBody:  'Baseのトランザクション履歴を取得中',
    errorTitle:   'エラーが発生しました',
    errorBody:    '懺悔室は一時的に利用できません。',
    tryAgain:     'もう一度試す',
    reset:        'リセット',

    // ConfessionCard
    confessionOf:    '懺悔人',
    iConfess:        '私は告白します...',
    sinLevel:        '罪のレベル',
    theRecord:       '記録',
    latest100:       '直近100件のトランザクションに基づく',
    shareButton:     'Farcasterで懺悔する',
    disclaimer:      'Base メインネットデータ使用 · 免罪は保証されません。',

    // Stats labels
    statTotalTx:    '総TX数',
    statGas:        'ガス消費',
    statCalls:      'コントラクト呼び出し',
    statDeploys:    'デプロイ数',
    statNight:      '深夜TX',
    statFailed:     '失敗TX',
    statInactive:   '未活動日数',
    statAge:        'ウォレット年齢',

    // Sin labels
    sinArchSinner:  '大罪人',
    sinModerate:    '常習犯',
    sinOccasional:  '軽度の罪人',
    sinMostly:      'ほぼ無実',
    sinPure:        '清廉な魂',
  },
} as const satisfies Record<Lang, Record<string, string>>;

export type TKeys = keyof typeof t.en;
