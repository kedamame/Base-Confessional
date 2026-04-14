import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// スクリーンショット3: 罪スコア + 統計パネル
export async function GET() {
  const stats = [
    { label: 'TOTAL TX', value: '147' },
    { label: 'GAS BURNED', value: '0.04721 ETH' },
    { label: 'CONTRACT CALLS', value: '89' },
    { label: 'DEPLOYMENTS', value: '3' },
    { label: 'NIGHT TX', value: '7' },
    { label: 'FAILED TX', value: '2' },
    { label: 'DAYS INACTIVE', value: '43' },
    { label: 'WALLET AGE', value: '312d' },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          background: '#0a0a0a',
          padding: '160px 100px',
          gap: 0,
        }}
      >
        {/* Sin Score */}
        <p style={{ fontSize: 14, letterSpacing: '0.35em', color: '#8a7f78', margin: 0, fontFamily: 'sans-serif' }}>
          SIN LEVEL
        </p>
        <p style={{ fontSize: 80, fontWeight: 300, color: '#f5f0eb', margin: '12px 0 0', fontFamily: 'sans-serif' }}>
          62 <span style={{ fontSize: 32, color: '#8a7f78' }}>/ 100</span>
        </p>
        <p style={{ fontSize: 22, color: '#f97316', margin: '8px 0 0', fontStyle: 'italic', fontFamily: 'sans-serif' }}>
          常習犯 — Moderate Sinner
        </p>

        {/* プログレスバー */}
        <div style={{ width: '80%', height: 2, background: '#2e2a27', marginTop: 40, marginBottom: 80, position: 'relative', display: 'flex' }}>
          <div style={{ width: '62%', height: '100%', background: '#f97316' }} />
        </div>

        {/* 統計 */}
        <p style={{ fontSize: 14, letterSpacing: '0.35em', color: '#8a7f78', margin: '0 0 30px', fontFamily: 'sans-serif' }}>
          THE RECORD
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 0 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                padding: '18px 0',
                borderBottom: '1px solid #1e1a18',
              }}
            >
              <span style={{ fontSize: 14, letterSpacing: '0.25em', color: '#8a7f78', fontFamily: 'sans-serif' }}>
                {s.label}
              </span>
              <span style={{ fontSize: 20, color: '#d0c8c0', fontFamily: 'monospace' }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1284, height: 2778 },
  );
}
