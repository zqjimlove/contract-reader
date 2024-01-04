import { ConnectButton } from '@rainbow-me/rainbowkit'
import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { find, uniq } from 'lodash'
import {
  AppShell,
  AppShellHeader,
  Button,
  Input,
  JsonInput,
  Loader,
  Modal,
  ScrollArea,
  Select,
  TextInput,
} from '@mantine/core'

import {
  erc20ABI,
  erc721ABI,
  readContracts,
  usePublicClient,
  useWalletClient,
} from 'wagmi'
console.log(
  '💬️ ~ file: index.tsx:18 ~ erc20ABI:',
  erc20ABI,
  erc721ABI
)
import {
  useDisclosure,
  useInputState,
} from '@mantine/hooks'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../src/libs/db'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Address,
  getAddress,
  getContract,
  isAddress,
} from 'viem'
import { formatResult } from '../src/utils/format'

const Home: NextPage = () => {
  // const [address, setAddress] = useInputState('')
  // const [abiType, setABIType] = useInputState('')
  // const [selectedMethod, setSelectedMethod] =
  //   useInputState('')

  const walletClient = useWalletClient()
  const publicClient = usePublicClient()
  const [logs, setLogs] = useState<any[]>([])

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
      return erc20ABI
    }
    if (abiType === 'erc721ABI') {
      return erc721ABI
    }

    const json = find(customABIs, { name: abiType })?.json

    return JSON.parse(json || '[]')
  }, [form.values.abiType])

  const methods = useMemo(() => {
    return abi.filter((item) => item.type === 'function')
  }, [abi])

  const selectedMethod = useMemo(() => {
    if (!form.values.method) return
    const m = methods?.[Number(form.values.method)]
    return m
  }, [form.values.method, methods])

  const callContract = async () => {
    if (!walletClient.data) {
      notifications.show({
        message: 'wallet not connected',
      })
      return
    }

    const isRead =
      selectedMethod?.stateMutability === 'view'

    const contract = getContract({
      address: getAddress(form.values.address),
      abi,
      walletClient: walletClient.data,
      publicClient,
    })

    try {
      let res: any

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
      setLogs((p) => [logObj, ...p])

      if (isRead) {
        res = await contract.read[selectedMethod.name](
          form.values.inputs
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

      setLogs((p) => [...p])
    } catch (error: any) {
      notifications.show({
        title: 'error',
        message: error.message,
        color: 'red',
      })
    }
  }

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
      }}>
      <AppShellHeader>
        <div className="flex justify-end h-14 items-center px-10">
          <ConnectButton />
        </div>
      </AppShellHeader>

      <AppShell.Navbar p="sm">
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
                    placeholder={item.type}
                    {...form.getInputProps(
                      `inputs.${index}`
                    )}
                  />
                )
              }
            )}

            {selectedMethod?.stateMutability ? (
              selectedMethod?.stateMutability === 'view' ? (
                <Button
                  onClick={callContract}
                  color="green">
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
    </AppShell>
  )
}

export default Home
