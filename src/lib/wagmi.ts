import { http, createConfig, createStorage, cookieStorage } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

export const config = createConfig({
  chains: [base],
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: 'Base Confessional', preference: 'all' }),
    walletConnect({ projectId, showQrModal: true }),
  ],
  transports: {
    [base.id]: http(),
  },
  multiInjectedProviderDiscovery: true,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
});
