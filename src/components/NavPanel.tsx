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
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  Dispatch,
  memo,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  erc20Abi,
  erc721Abi,
  getAddress,
  getContract,
  isAddress,
} from 'viem'
import { useAtom } from 'jotai'
import { formatResult } from '../utils/format'
import { db } from '../libs/db'

interface NavPanelProps {
  setLogs: Dispatch<SetStateAction<any[]>>
}

const NavPanel: React.FC<NavPanelProps> = ({ setLogs }) => {
  const walletClient = useWalletClient()

  const publicClient = usePublicClient()

  const form = useForm({
    initialValues: {
      address: '',
      abiType: '',
      method: '',
      value: '',
      inputs: [],
    },
    validate: {
      address: (value) =>
        isAddress(value) ? '' : 'not valid address',
    },
  })

  useEffect(() => {
    form.setFieldValue('method', '')
    form.setFieldValue('inputs', [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.abiType])

  const customABIs = useLiveQuery(async () => {
    return await db.getABITypes()
  })

  const [addModalVisible, addModalVisibleHandler] =
    useDisclosure(false)

  const addForm = useForm({
    initialValues: {
      name: '',
      json: '',
    },
  })

  const abi: any[] = useMemo(() => {
    const { abiType } = form.values
    if (abiType === 'erc20ABI') {
      return erc20Abi
    }
    if (abiType === 'erc721ABI') {
      return erc721Abi
    }

    const json = find(customABIs, { name: abiType })?.json

    return JSON.parse(json || '[]')
  }, [customABIs, form.values])

  const methods = useMemo(() => {
    return abi.filter((item) => item.type === 'function')
  }, [abi])

  const selectedMethod = useMemo(() => {
    if (!form.values.method) return
    const m = methods?.[Number(form.values.method)]
    return m
  }, [form.values.method, methods])

  const callContract = useCallbackRef(async () => {
    if (!walletClient.data) {
      notifications.show({
        message: 'wallet not connected',
      })
      return
    }

    const isRead =
      selectedMethod?.stateMutability === 'view'

    const contract: any = getContract({
      address: getAddress(form.values.address),
      abi,
      client: {
        wallet: walletClient.data,
        public: publicClient,
      },
      // publicClient,
    })

    const logObj = {
      message: `${form.values.address} ${
        isRead ? 'read' : 'write'
      } [${
        selectedMethod.name
      }] with [${form.values.inputs.join(
        ','
      )}] got result:`,
      result: '',
    }
    try {
      let res: any

      setLogs((p) => [logObj, ...p])

      if (isRead) {
        res = await contract.read[selectedMethod.name](
          form.values.inputs.map((v: string) => {
            if (
              v.trim().startsWith('{') &&
              v.trim().endsWith('}')
            ) {
              return JSON.parse(v)
            }
            return v
          })
        )
      } else {
        res = await contract.write[selectedMethod.name](
          form.values.inputs,
          selectedMethod.stateMutability === 'payable'
            ? {
                value: BigInt(form.values.value),
              }
            : undefined
        )
      }

      logObj.result = formatResult(res)
    } catch (error: any) {
      console.error(error)
      notifications.show({
        title: 'error',
        message: error.message,
        color: 'red',
      })
      logObj.result = error.message
    } finally {
      setLogs((p) => [...p])
    }
  })

  return (
    <>
      <ScrollArea>
        <div className="flex flex-col gap-4">
          <TextInput
            label="合约地址"
            placeholder="合约地址"
            {...form.getInputProps('address')}
          />
          <Select
            classNames={{
              label: 'w-full',
            }}
            label={
              <div className="flex justify-between w-full">
                ABI Type
                <Button
                  onClick={addModalVisibleHandler.open}
                  size="compact-xs"
                  variant="subtle">
                  Add
                </Button>
              </div>
            }
            placeholder="Pick value"
            data={[
              'erc20ABI',
              'erc721ABI',
              ...(customABIs?.map((v) => v.name) || []),
            ]}
            {...form.getInputProps('abiType')}
          />
          {!!methods.length && (
            <Select
              label={'Methods'}
              placeholder="Pick value"
              data={methods.map((m, index) => ({
                value: String(index),
                label: `${m.name}`,
              }))}
              {...form.getInputProps('method')}
            />
          )}
          {selectedMethod?.stateMutability ===
            'payable' && (
            <TextInput
              label={'Value'}
              {...form.getInputProps(`value`)}
            />
          )}
          {selectedMethod?.inputs.map(
            (item: any, index: number) => {
              return (
                <TextInput
                  key={item.name}
                  label={item.name}
                  placeholder={
                    item.type === 'tuple'
                      ? 'tuple(JSON)'
                      : item.type
                  }
                  {...form.getInputProps(`inputs.${index}`)}
                />
              )
            }
          )}

          {selectedMethod?.stateMutability ? (
            selectedMethod?.stateMutability === 'view' ? (
              <Button onClick={callContract} color="green">
                Read
              </Button>
            ) : (
              <Button onClick={callContract} color="red">
                Write
              </Button>
            )
          ) : null}
        </div>
      </ScrollArea>
      <Modal
        size="lg"
        opened={addModalVisible}
        closeOnClickOutside={false}
        onClose={addModalVisibleHandler.close}>
        <TextInput
          label="Name"
          {...addForm.getInputProps('name')}
        />
        <JsonInput
          label="ABI JSON"
          formatOnBlur
          autosize
          minRows={10}
          size="xl"
          {...addForm.getInputProps('json')}
        />
        <Button
          className="mt-5"
          onClick={async () => {
            await db.abiTypes.add(addForm.values)
            notifications.show({
              message: 'Add successful!⭐️',
            })
            addModalVisibleHandler.close()
          }}>
          Save
        </Button>
      </Modal>
    </>
  )
}

export default memo(NavPanel)
