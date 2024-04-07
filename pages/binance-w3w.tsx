import React, { memo, useEffect, useState } from 'react'

import { Button } from '@mantine/core'
import { parseEther } from 'viem'
import { useMount } from 'ahooks'

interface TestProps {
  _?: any
}

const Test: React.FC<TestProps> = () => {
  const [provider, setProvider] = useState<any>()

  const [accounts, setAccounts] = useState<any>(null)

  const [ready, setReady] = useState(false)
  useMount(() => {
    setReady(true)
  })

  useEffect(() => {
    const init = async () => {
      const getProvider = (
        await import('@binance/w3w-ethereum-provider')
      ).getProvider
      const provider = getProvider({ chainId: 56 })
      setProvider(provider)
    }

    init()
  }, [])

  if (!ready) return null

  return (
    <div className="flex flex-col gap-2">
      <div>accounts: {accounts}</div>
      {!accounts && (
        <Button
          onClick={async () => {
            setAccounts(await provider.enable())
          }}>
          Connect
        </Button>
      )}
      {!!accounts && (
        <div className="flex flex-col gap-2 w-[120px]">
          <Button
            onClick={async () => {
              try {
                const txHash = await provider.request({
                  method: 'eth_sendTransaction',
                  params: [
                    {
                      to: accounts[0],
                      from: accounts[0],
                      value:
                        parseEther('0.0001').toString(16),
                    },
                  ],
                })
                debugger;
                alert(txHash)
              } catch (error) {
                console.error(error)
              }
            }}>
            Send
          </Button>
          <Button
            onClick={async () => {
              const txHash = await provider.disconnect()
              window.location.reload()
            }}>
            Disconnect
          </Button>
        </div>
      )}
    </div>
  )
}

export default memo(Test)
