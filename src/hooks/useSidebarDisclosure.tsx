import { useAtom } from 'jotai'
import { SidebarOpenAtom } from '../jotai'
import { useMemo } from 'react'

export default function useSidebarDisclosure() {
  const [value, set] = useAtom(SidebarOpenAtom)

  return useMemo(
    () =>
      [
        value,
        {
          toggle: () => {
            set((p) => !p)
          },
          setFalse: () => set(false),
          setTrue: () => set(true),
        },
      ] as const,
    [set, value]
  )
}
