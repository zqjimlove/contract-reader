import { ConnectButton } from '@rainbow-me/rainbowkit'
import type { NextPage } from 'next'
import { find } from 'lodash'
import {
  AppShell,
  AppShellHeader,
  Burger,
  Button,
  JsonInput,
  Loader,
  Modal,
  ScrollArea,
  Select,
  TextInput,
} from '@mantine/core'

import {
  useAccount,
  useConfig,
  usePublicClient,
  useWalletClient,
} from 'wagmi'

import {
  useCallbackRef,
  useDisclosure,
} from '@mantine/hooks'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../src/libs/db'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useEffect, useMemo, useState } from 'react'
import {
  erc20Abi,
  erc721Abi,
  getAddress,
  getContract,
  isAddress,
} from 'viem'
import { formatResult } from '../src/utils/format'
import AddNetworkModal, {
  AddNetworkModalVisibleAtom,
} from '../src/components/AddNetworkModal'
import { useAtom } from 'jotai'
import NavPanel from '../src/components/NavPanel'

const Home: NextPage = () => {
  const [, setAddNetworkModalVisible] = useAtom(
    AddNetworkModalVisibleAtom
  )
  const walletClient = useWalletClient()

  const { chainId, chain } = useAccount()
  const { chains: wagmiChains } = useConfig()
  const isCurrentChainSupported = wagmiChains.some(
    (chain) => chain.id === chainId
  )

  const [logs, setLogs] = useState<any[]>([])

  const [opened, { toggle }] = useDisclosure(true)

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { desktop: false, mobile: !opened },
      }}>
      <AppShellHeader>
        <div className="flex justify-end h-14 items-center px-2 md:px-10 gap-2">
          <div className="mr-auto">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
          </div>
          {!isCurrentChainSupported &&
            walletClient.data && (
              <Button
                color="blue"
                h={40}
                radius={'12px'}
                onClick={() =>
                  setAddNetworkModalVisible(true)
                }
                size="md">
                Add Network
              </Button>
            )}

          <ConnectButton showBalance chainStatus="icon" />
        </div>
      </AppShellHeader>

      <AppShell.Navbar p="sm">
        <NavPanel setLogs={setLogs} />
      </AppShell.Navbar>

      <AppShell.Main>
        <div className="p-4">
          {logs.map((l, index) => (
            <p key={index}>
              {l.message}
              {!l.result ? (
                <Loader size="xs" />
              ) : (
                <span className=" text-yellow-700">
                  {l.result}
                </span>
              )}
            </p>
          ))}
        </div>
      </AppShell.Main>

      <AddNetworkModal />
    </AppShell>
  )
}

export default Home
