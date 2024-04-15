import { Button, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useCallbackRef } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { result } from 'lodash'
import React, {
  Dispatch,
  memo,
  SetStateAction,
} from 'react'
import { isAddress, parseEther } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'
import { useIsSmallScreen } from '../hooks/useIsSmallScreen'
import useSidebarDisclosure from '../hooks/useSidebarDisclosure'

interface NavPanelTransferProps {
  setLogs: Dispatch<SetStateAction<any[]>>
}

const NavPanelTransfer: React.FC<NavPanelTransferProps> = ({
  setLogs,
}) => {
  const walletClient = useWalletClient()

  const publicClient = usePublicClient()

  const form = useForm({
    initialValues: {
      address: '',
      value: '',
    },
    validate: {
      address: (value) =>
        isAddress(value) ? '' : 'not valid address',
    },
  })

  const isSmallScreen = useIsSmallScreen()
  const [_, { setFalse: closeSidebar }] =
    useSidebarDisclosure()
  const send = useCallbackRef(async () => {
    try {
      if (!isAddress(form.values.address)) {
        notifications.show({
          title: 'error',
          message: 'address invalid',
          color: 'red',
        })
        return
      }
      const hash = await walletClient.data?.sendTransaction(
        {
          to: form.values.address,
          value: parseEther(form.values.value),
        }
      )
      setLogs((p) => [
        {
          message: `Send Native Coin to ${form.values.address} hash:`,
          result: hash,
        },
        ...p,
      ])
    } catch (error: any) {
      setLogs((p) => [
        {
          message: `Send Native Coin to ${form.values.address} hash:`,
          result: error.message,
        },
        ...p,
      ])
    } finally {
      if (isSmallScreen) {
        closeSidebar()
      }
    }
  })

  return (
    <div className="flex flex-col gap-4">
      <TextInput
        label="Receiver Address"
        placeholder="Receiver Address"
        {...form.getInputProps('address')}
      />
      <TextInput
        label={'Value'}
        {...form.getInputProps(`value`)}
      />
      <Button onClick={send} color="red">
        Send
      </Button>
    </div>
  )
}

export default memo(NavPanelTransfer)
