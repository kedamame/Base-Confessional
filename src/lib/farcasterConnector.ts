import { createConnector } from 'wagmi';

// Farcaster SDK の EthereumProvider を直接 wagmi コネクターとして使う。
// window.ethereum を経由しないため、ブラウザ拡張ウォレットが開かない。
export function farcasterWalletConnector() {
  async function getProvider() {
    const { sdk } = await import('@farcaster/miniapp-sdk');
    const p = await sdk.wallet.getEthereumProvider();
    if (!p) throw new Error('Farcaster wallet provider not available');
    return p;
  }

  return createConnector((config) => ({
    id: 'farcasterWallet',
    name: 'Farcaster Wallet',
    type: 'farcasterWallet' as const,

    async connect(params) {
      const provider = await getProvider();
      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as readonly `0x${string}`[];

      const rawChainId = (await provider.request({
        method: 'eth_chainId',
      })) as string;
      const chainId = Number(rawChainId);

      if (params?.chainId && chainId !== params.chainId) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${params.chainId.toString(16)}` }],
          });
        } catch {
          // チェーン切り替え失敗は無視
        }
      }

      // wagmi v2 の withCapabilities 条件型を回避するキャスト
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { accounts, chainId } as any;
    },

    async disconnect() {
      // Farcaster wallet は logout 不要
    },

    async getAccounts() {
      const provider = await getProvider();
      return (await provider.request({
        method: 'eth_accounts',
      })) as readonly `0x${string}`[];
    },

    async getChainId() {
      const provider = await getProvider();
      const chainId = (await provider.request({
        method: 'eth_chainId',
      })) as string;
      return Number(chainId);
    },

    async getProvider() {
      return getProvider();
    },

    async isAuthorized() {
      try {
        const accounts = await this.getAccounts();
        return accounts.length > 0;
      } catch {
        return false;
      }
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        config.emitter.emit('disconnect');
      } else {
        config.emitter.emit('change', {
          accounts: accounts as readonly `0x${string}`[],
        });
      }
    },

    onChainChanged(chainId) {
      config.emitter.emit('change', { chainId: Number(chainId) });
    },

    onDisconnect() {
      config.emitter.emit('disconnect');
    },
  }));
}
