import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/providers/AppProvider';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://base-confessional.vercel.app';

const miniAppEmbed = {
  version: '1',
  imageUrl: `${APP_URL}/opengraph-image`,
  button: {
    title: 'Confess Your Sins',
    action: {
      type: 'launch_miniapp',
      name: 'Base Confessional',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: '#0a0608',
    },
  },
};

export const metadata: Metadata = {
  title: 'Base Confessional',
  description:
    'Your wallet has sins. Time to confess them on Base.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'Base Confessional',
    description: 'Your wallet has sins. Time to confess them.',
    type: 'website',
    images: ['/og-image.png'],
  },
  other: {
    'fc:miniapp': JSON.stringify(miniAppEmbed),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
