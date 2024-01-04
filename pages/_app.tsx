import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit'
import type { AppProps } from 'next/app'
import {
  configureChains,
  createConfig,
  WagmiConfig,
} from 'wagmi'
import * as allChainsMap from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { createTheme, MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { Notifications } from '@mantine/notifications'

const allChains: any[] = Object.keys(allChainsMap).map(
  (key) => (allChainsMap as any)[key]
)

const { chains, publicClient, webSocketPublicClient } =
  configureChains([...allChains], [publicProvider()])

const { connectors } = getDefaultWallets({
  appName: 'RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains,
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

const theme = createTheme({
  primaryColor: 'yellow',
})

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <MantineProvider theme={theme}>
          <Notifications />
          <Component {...pageProps} />
        </MantineProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}

export default MyApp
