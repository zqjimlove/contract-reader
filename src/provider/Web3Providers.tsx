'use client'

import * as React from 'react'
import {
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { _chains } from '@rainbow-me/rainbowkit/dist/config/getDefaultConfig'
import * as allChainsMap from 'wagmi/chains'
import { useCustomChains } from '../hooks/useCustomChains'
import { defineChain } from 'viem'
const { wallets } = getDefaultWallets()

const allChains = Object.keys(allChainsMap).map(
  (key) => (allChainsMap as any)[key]
) as unknown as _chains

const config = getDefaultConfig({
  appName: 'Contract render',
  projectId: '437f3645b09116c14205e13d206cb285',
  chains: allChains,
  ssr: true,
})

const queryClient = new QueryClient()

export function Web3Providers({
  children,
}: {
  children: React.ReactNode
}) {
  const { customChains } = useCustomChains()

  const config = React.useMemo(
    () =>
      getDefaultConfig({
        appName: 'Contract render',
        projectId: '437f3645b09116c14205e13d206cb285',
        chains: [
          ...allChains,
          ...customChains.map((c: any) =>
            defineChain({
              id: c.chainId,
              name: c.name,
              nativeCurrency: {
                name: 'unknown',
                symbol: 'unknown',
                decimals: 18,
              },
              rpcUrls: {
                default: {
                  http: [c.rpc],
                },
              },
              blockExplorers: {
                default: {
                  name: 'default',
                  url: c.explorer,
                },
              },
            })
          ),
        ],
        ssr: true,
      }),
    [customChains]
  )
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
