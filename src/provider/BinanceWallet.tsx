import {
  Wallet,
  getWalletConnectConnector,
} from '@rainbow-me/rainbowkit'
import {
  binanceWallet,
  getWagmiConnectorV2,
} from '@binance/w3w-wagmi-connector-v2'
import {
  ChainNotConfiguredError,
  Connector,
  createConnector,
  CreateConnectorFn,
  normalizeChainId,
} from 'wagmi'
import { DefaultWalletOptions } from '@rainbow-me/rainbowkit/dist/wallets/Wallet'
import {
  getAddress,
  numberToHex,
  ProviderRpcError,
  SwitchChainError,
  UserRejectedRequestError,
} from 'viem'
import type BinanceProvider from '@binance/w3w-ethereum-provider'

type BinanceWalletOptions = DefaultWalletOptions & {
  parameters?: any
}

async function getWalletConnectUri(
  connector: Connector
): Promise<string> {
  const provider: any = await connector.getProvider()
  return new Promise<string>((resolve) =>
    provider.once('uri_ready', resolve)
  )
}

export const BinanceWallet = ({
  projectId,
  walletConnectParameters,
  parameters = {},
}: BinanceWalletOptions): Wallet => {
  type Provider = BinanceProvider
  type Properties = Record<string, unknown>
  let provider_: Provider | undefined
  let providerPromise: any
  let uri: string
  let enablePromise: any

  return {
    id: 'binance',
    name: 'Binance Web3 Wallet',
    iconUrl: async () => {
      const result = (
        await import('./BinanceWalletIcon.svg')
      ).default.src
      return result
    },
    iconAccent: '#1E1E1E',
    iconBackground: '#1E1E1E',
    downloadUrls: {
      android:
        'https://play.google.com/store/apps/details?id=com.binance.dev',
      ios: 'https://apps.apple.com/us/app/binance-buy-bitcoin-crypto/id1436799971',
      mobile: 'https://www.binance.com/en/download',
      qrCode: 'https://www.binance.com/en/download',
    },
    mobile: {
      getUri: (uri: string) => {
        return uri
      },
    },
    qrCode: {
      getUri() {
        return uri
      },
      instructions: {
        learnMoreUrl: 'https://my-wallet/learn-more',
        steps: [
          {
            description:
              'We recommend putting My Wallet on your home screen for faster access to your wallet.',
            step: 'install',
            title: 'Open the My Wallet app',
          },
          {
            description:
              'After you scan, a connection prompt will appear for you to connect your wallet.',
            step: 'scan',
            title: 'Tap the scan button',
          },
        ],
      },
    },
    extension: {
      instructions: {
        learnMoreUrl: 'https://my-wallet/learn-more',
        steps: [
          {
            description:
              'We recommend pinning My Wallet to your taskbar for quicker access to your wallet.',
            step: 'install',
            title: 'Install the My Wallet extension',
          },
          {
            description:
              'Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.',
            step: 'create',
            title: 'Create or Import a Wallet',
          },
          {
            description:
              'Once you set up your wallet, click below to refresh the browser and load up the extension.',
            step: 'refresh',
            title: 'Refresh your browser',
          },
        ],
      },
    },
    createConnector: (walletDetails) => {
      return createConnector((config) => {
        return {
          ...walletDetails,
          id: 'BinanceW3WSDK',
          name: 'Binance Web3 Wallet',
          type: binanceWallet.type,
          async setup() {
            const provider: any = await this.getProvider()
            if (!provider) return
            provider.on(
              'connect',
              this.onConnect?.bind(this)
            )
          },
          onDisplayUri(uri: string) {
            console.log('💬️ ~ onDisplayUri ~ uri:', uri)

            config.emitter.emit('message', {
              type: 'display_uri',
              data: uri,
            })
          },
          async connect({ chainId } = {}) {
            chainId = chainId ?? 56
            const provider: any = await this.getProvider({
              chainId,
            })

            // if (uri) {
            //   setTimeout(() => {
            //     provider.events.emit('display_uri', uri)
            //     this.onDisplayUri(uri)
            //   }, 200)
            // }

            provider.signClient.coreConnection.on(
              'display_uri',
              () => {
                uri = provider.signClient.coreConnection.uri
                provider.events.emit('display_uri', uri)
                this.onDisplayUri(uri)
              }
            )

            provider.on('uri_ready', this.onDisplayUri)
            provider.on(
              'accountsChanged',
              this.onAccountsChanged.bind(this)
            )
            provider.on(
              'chainChanged',
              this.onChainChanged.bind(this)
            )
            provider.on(
              'disconnect',
              this.onDisconnect.bind(this)
            )
            setTimeout(
              () =>
                config.emitter.emit('message', {
                  type: 'connecting',
                }),
              0
            )

            provider.setLng('en')

            // if (
            //   provider.signClient.coreConnection.pending
            // ) {
            //   provider.signClient.coreConnection._connected =
            //     true
            //   try {
            //     provider.signClient.coreConnection.killSession()
            //   } catch (error) {
            //     console.error(error);
            //   }
            // }

            // console.log(
            //   '💬️ ~ connect ~ provider:',
            //   provider
            // )

            if (
              !provider.signClient.coreConnection.pending
            ) {
              enablePromise = provider.enable()
            } else {
              provider.events.emit('display_uri', uri)
              this.onDisplayUri(uri)
            }

            const accounts = await enablePromise
            const id: number = await this.getChainId()
            return { accounts, chainId: id }
          },
          async disconnect() {
            const provider: any = await this.getProvider()
            provider.disconnect()

            provider.removeListener(
              'accountsChanged',
              this.onAccountsChanged
            )
            provider.removeListener(
              'chainChanged',
              this.onChainChanged
            )
            provider.removeListener(
              'disconnect',
              this.onDisconnect
            )
          },
          async getAccounts() {
            const provider: any = await this.getProvider()
            const accounts = (await provider.request({
              method: 'eth_accounts',
            })) as string[]
            return accounts.map((x) => getAddress(x))
          },
          async getChainId() {
            const provider: any = await this.getProvider()
            const chainId =
              provider.chainId ??
              (await provider?.request({
                method: 'eth_chainId',
              }))
            return normalizeChainId(chainId)
          },
          async getProvider({
            chainId,
          }: { chainId?: number } = {}) {
            async function initProvider() {
              const BinanceProvider = (
                await import(
                  '@binance/w3w-ethereum-provider'
                )
              ).default

              const targetChainId =
                chainId || config.chains[0]?.id
              const rpc = !parameters.infuraId
                ? config.chains.reduce(
                    (rpcProps, chain) => ({
                      ...rpcProps,
                      [chain.id]:
                        chain.rpcUrls.default.http[0],
                    }),
                    {}
                  )
                : {}

              const providerInstance = new BinanceProvider({
                ...parameters,
                chainId: targetChainId,
                rpc: rpc,
                showQrCodeModal: false,
              })

              return providerInstance
            }

            if (!provider_) {
              if (!providerPromise)
                providerPromise = initProvider()
              provider_ = await providerPromise
            }
            return provider_
          },
          async isAuthorized() {
            try {
              const account = await this.getAccounts()
              return !!account
            } catch {
              return false
            }
          },
          async switchChain({ chainId }) {
            const chain = config.chains.find(
              (chain) => chain.id === chainId
            )
            if (!chain)
              throw new SwitchChainError(
                new ChainNotConfiguredError()
              )

            const provider: any = await this.getProvider()
            const id = numberToHex(chain.id)

            try {
              await Promise.race([
                provider.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: id }],
                }),
                new Promise((res) =>
                  config.emitter.once(
                    'change',
                    ({ chainId: currentChainId }) => {
                      if (currentChainId === chainId)
                        res(chainId)
                    }
                  )
                ),
              ])
              return chain
            } catch (error: any) {
              const message =
                typeof error === 'string'
                  ? error
                  : (error as ProviderRpcError)?.message
              if (/user rejected request/i.test(message))
                throw new UserRejectedRequestError(error)
              throw new SwitchChainError(error)
            }
          },
          onAccountsChanged(accounts: string[]) {
            if (accounts.length === 0)
              config.emitter.emit('disconnect')
            else
              config.emitter.emit('change', {
                accounts: accounts.map((x) =>
                  getAddress(x)
                ),
              })
          },
          onChainChanged(chain) {
            const chainId = normalizeChainId(chain)
            config.emitter.emit('change', { chainId })
          },
          async onConnect(connectInfo) {
            const accounts = await this.getAccounts()
            if (accounts.length === 0) return

            const chainId = normalizeChainId(
              connectInfo.chainId
            )
            config.emitter.emit('connect', {
              accounts,
              chainId,
            })

            const provider: any = await this.getProvider()
            if (provider) {
              provider.removeListener(
                'connect',
                this.onConnect?.bind(this)
              )
              provider.on(
                'accountsChanged',
                this.onAccountsChanged.bind(this)
              )
              provider.on(
                'chainChanged',
                this.onChainChanged
              )
              provider.on(
                'disconnect',
                this.onDisconnect.bind(this)
              )
            }
          },
          async onDisconnect(error) {
            config.emitter.emit('disconnect')
            const provider: any = await this.getProvider()
            provider.removeListener(
              'accountsChanged',
              this.onAccountsChanged.bind(this)
            )
            provider.removeListener(
              'chainChanged',
              this.onChainChanged
            )
            provider.removeListener(
              'disconnect',
              this.onDisconnect.bind(this)
            )
            provider.on(
              'connect',
              this.onConnect?.bind(this)
            )
          },
        }
      })
    },
  }
}
