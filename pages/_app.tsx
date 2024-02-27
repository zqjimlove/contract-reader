import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit'
import type { AppProps } from 'next/app'
import { WagmiProvider } from 'wagmi'
import * as allChainsMap from 'wagmi/chains'
import { createTheme, MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { Notifications } from '@mantine/notifications'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { _chains } from '@rainbow-me/rainbowkit/dist/config/getDefaultConfig'
import { Web3Providers } from '../src/provider/Web3Providers'

const allChains = Object.keys(allChainsMap).map(
  (key) => (allChainsMap as any)[key]
) as unknown as _chains

// const { chains, publicClient, webSocketPublicClient } =
//   configureChains([...allChains], [publicProvider()])

// const { connectors } = getDefaultWallets({
//   appName: 'RainbowKit App',
//   projectId: 'YOUR_PROJECT_ID',
//   chains,
// })

/* const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
}) */

const theme = createTheme({
  primaryColor: 'yellow',
})

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3Providers>
      <MantineProvider theme={theme}>
        <Notifications />
        <Component {...pageProps} />
      </MantineProvider>
    </Web3Providers>
  )
}

export default MyApp
