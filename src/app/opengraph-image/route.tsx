import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Farcaster embed 用 — 3:2 (900×600)
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
          padding: 60,
          gap: 0,
        }}
      >
        <div style={{ width: 1, height: 60, background: '#2e2a27', marginBottom: 32 }} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#8a7f78',
              margin: 0,
              fontFamily: 'sans-serif',
            }}
          >
            Confessional
          </p>
          <h1
            style={{
              fontSize: 42,
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
              fontSize: 14,
              color: '#8a7f78',
              margin: 0,
              fontStyle: 'italic',
              fontFamily: 'sans-serif',
            }}
          >
            Your wallet has sins. Time to confess them.
          </p>
        </div>
        <div style={{ width: 1, height: 60, background: '#2e2a27', marginTop: 32 }} />
      </div>
    ),
    { width: 900, height: 600 },
  );
}
