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
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
        }}
      >
        {/* 十字架シルエット */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
          }}
        >
          <div style={{ width: 60, height: 180, background: '#f5f0eb' }} />
          <div
            style={{
              width: 220,
              height: 60,
              background: '#f5f0eb',
              marginTop: -140,
            }}
          />
        </div>
      </div>
    ),
    { width: 1024, height: 1024 },
  );
}
