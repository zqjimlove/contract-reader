import { Button, Input, Modal } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useLocalStorage } from '@mantine/hooks'
import { atom, useAtom } from 'jotai'
import React, { memo, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useCustomChains } from '../hooks/useCustomChains'
import { uniqBy } from 'lodash'

interface AddNetworkModalProps {
  _?: any
}

export const AddNetworkModalVisibleAtom = atom(false)

const AddNetworkModal: React.FC<
  AddNetworkModalProps
> = () => {
  const [visible, setVisible] = useAtom(
    AddNetworkModalVisibleAtom
  )
  const { chainId } = useAccount()

  const { setCustomChain } = useCustomChains()

  const form = useForm({
    initialValues: {
      chainId,
      name: '',
      rpc: '',
      explorer: '',
    },

    validate: {},
  })

  useEffect(() => {
    if (visible) {
      form.setValues({
        chainId,
        name: '',
        rpc: '',
        explorer: '',
      })
    }
  }, [visible])

  return (
    <Modal
      opened={visible}
      title={'Add Network'}
      onClose={() => setVisible(false)}>
      <form
        onSubmit={form.onSubmit((values) => {
          setCustomChain((p: any[]) =>
            uniqBy([...p, values], 'chainId')
          )
          setVisible(false)
        })}
        className="flex flex-col gap-4"
        action="">
        <Input.Wrapper label="Chain Id">
          <Input
            placeholder="Entry chain id"
            {...form.getInputProps('chainId')}
          />
        </Input.Wrapper>
        <Input.Wrapper label="Chain Name">
          <Input
            placeholder="Entry name"
            {...form.getInputProps('name')}
          />
        </Input.Wrapper>
        <Input.Wrapper label="Chain RPR URL">
          <Input
            placeholder="Entry url of RPC"
            {...form.getInputProps('rpc')}
          />
        </Input.Wrapper>
        <Input.Wrapper label="Chain Explorer URL">
          <Input
            placeholder="Entry url of Explorer"
            {...form.getInputProps('explorer')}
          />
        </Input.Wrapper>
        <Button type="submit" fullWidth>
          Submit
        </Button>
      </form>
    </Modal>
  )
}

export default memo(AddNetworkModal)
