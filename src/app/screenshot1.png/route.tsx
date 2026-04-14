import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// スクリーンショット1: 接続画面
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          padding: 80,
          gap: 0,
        }}
      >
        <p style={{ fontSize: 18, letterSpacing: '0.35em', color: '#8a7f78', margin: 0, fontFamily: 'sans-serif' }}>
          BASE · MAINNET
        </p>
        <div style={{ width: 40, height: 1, background: '#2e2a27', marginTop: 40, marginBottom: 40 }} />
        <h1 style={{ fontSize: 64, fontWeight: 300, color: '#f5f0eb', margin: 0, fontFamily: 'sans-serif', letterSpacing: '-0.02em' }}>
          Base Confessional
        </h1>
        <p style={{ fontSize: 24, color: '#8a7f78', margin: 0, marginTop: 20, fontStyle: 'italic', fontFamily: 'sans-serif' }}>
          Your wallet has sins. Time to confess them.
        </p>
        <div style={{ width: 40, height: 1, background: '#2e2a27', marginTop: 60, marginBottom: 80 }} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            width: 500,
          }}
        >
          {['Browser Wallet', 'Coinbase Wallet', 'WalletConnect'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '20px 0',
                border: '1px solid #2e2a27',
                color: '#8a7f78',
                fontSize: 16,
                letterSpacing: '0.25em',
                fontFamily: 'sans-serif',
              }}
            >
              {label.toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1284, height: 2778 },
  );
}
