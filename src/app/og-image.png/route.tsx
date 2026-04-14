import { ImageResponse } from 'next/og';

export const runtime = 'edge';

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
        {/* 上部ライン */}
        <div style={{ width: 40, height: 1, background: '#2e2a27', marginBottom: 40 }} />

        {/* タイトル */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: '#8a7f78',
              margin: 0,
              fontFamily: 'sans-serif',
            }}
          >
            Base Mainnet
          </p>
          <h1
            style={{
              fontSize: 52,
              fontWeight: 300,
              color: '#f5f0eb',
              margin: 0,
              letterSpacing: '-0.01em',
              fontFamily: 'sans-serif',
            }}
          >
            Base Confessional
          </h1>
          <p
            style={{
              fontSize: 16,
              color: '#8a7f78',
              margin: 0,
              fontStyle: 'italic',
              fontFamily: 'sans-serif',
            }}
          >
            Your wallet has sins. Time to confess them.
          </p>
        </div>

        {/* 下部ライン */}
        <div style={{ width: 40, height: 1, background: '#2e2a27', marginTop: 40 }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
