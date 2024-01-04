import { formatEther, parseEther } from 'viem'

export function formatResult(res: any) {
  if (typeof res === 'bigint') {
    return formatEther(res)
  }
  return res
}
