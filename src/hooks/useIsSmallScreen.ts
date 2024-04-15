import { useMediaQuery } from '@mantine/hooks'

export const useIsSmallScreen = () =>
  useMediaQuery('(max-width: 600px)')
