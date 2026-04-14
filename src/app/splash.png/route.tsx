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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
          }}
        >
          <div style={{ width: 10, height: 32, background: '#c8b89a' }} />
          <div
            style={{
              width: 36,
              height: 10,
              background: '#c8b89a',
              marginTop: -24,
            }}
          />
        </div>
      </div>
    ),
    { width: 200, height: 200 },
  );
}
