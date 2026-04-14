import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// スクリーンショット2: 懺悔文表示画面
export async function GET() {
  const confessions = [
    { icon: '🔥', text: '私は 0.0472 ETH をガス代に捧げました。それは $85 の食事分です。' },
    { icon: '👻', text: '最後にBase上で動いてから 43 日が経過しています。私はゴーストです。' },
    { icon: '🌃', text: '7 件の深夜TXを告白します。夜に判断力が下がることは証明されています。' },
    { icon: '❌', text: '2 件のTXがエラーで終わりました。ガスだけ払って何も起きない体験を知っています。' },
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
        {/* ヘッダー */}
        <p style={{ fontSize: 16, letterSpacing: '0.35em', color: '#8a7f78', margin: 0, fontFamily: 'sans-serif' }}>
          CONFESSIONAL
        </p>
        <p style={{ fontSize: 22, color: '#8a7f78', margin: '16px 0 0', fontFamily: 'monospace' }}>
          0x1a2b...3c4d
        </p>
        <div style={{ width: 60, height: 1, background: '#2e2a27', marginTop: 40, marginBottom: 60 }} />

        {/* 懺悔文リスト */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, width: '100%' }}>
          {confessions.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 28,
                borderLeft: '2px solid #c8b89a',
                paddingLeft: 28,
              }}
            >
              <span style={{ fontSize: 36, lineHeight: 1 }}>{c.icon}</span>
              <p style={{ fontSize: 22, color: '#d0c8c0', margin: 0, lineHeight: 1.6, fontFamily: 'sans-serif' }}>
                {c.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1284, height: 2778 },
  );
}
