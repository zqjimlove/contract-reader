import { useLocalStorage } from '@mantine/hooks'

export const useCustomChains = () => {
  const [customChains, setCustomChain] =
    useLocalStorage<any>({
      key: 'custom-chains',
      defaultValue: [],
    })
  return {
    customChains,
    setCustomChain,
  }
}
