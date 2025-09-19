import { createConfig, http } from 'wagmi'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'
import { defineChain } from 'viem'

export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: { name: 'Somnia', symbol: 'SOM', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/somnia_testnet'] },
    public: { http: ['https://rpc.ankr.com/somnia_testnet'] }
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://explorer.somnia.test' }
  },
  testnet: true
})

export const config = createConfig({
  chains: [somniaTestnet],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''
    })
  ],
  transports: {
    [somniaTestnet.id]: http('https://rpc.ankr.com/somnia_testnet')
  }
})
