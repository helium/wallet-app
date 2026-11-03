import { PortalHost, usePortal } from '@gorhom/portal'
import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
} from 'react'

type RootPortalHost = Pick<
  ReturnType<typeof usePortal>,
  'addPortal' | 'removePortal'
>

const RootPortalContext = createContext<RootPortalHost | null>(null)

// Every BottomSheetModalProvider wraps its children in a PortalProvider of
// its own, with no 'root' host. A gorhom <Portal> below one registers there
// and renders nothing. RootPortalProvider registers with the provider it sits
// in, renders that provider's 'root' host after its children, and hands the
// host to every RootPortal below it, past any nested provider.
export const RootPortalProvider = ({ children }: { children: ReactNode }) => {
  const { addPortal, removePortal } = usePortal('root')
  return (
    <RootPortalContext.Provider value={{ addPortal, removePortal }}>
      {children}
      <PortalHost name="root" />
    </RootPortalContext.Provider>
  )
}

const useRootPortalHost = () => {
  const host = useContext(RootPortalContext)
  if (!host) {
    throw new Error('RootPortal needs a RootPortalProvider above it')
  }
  return host
}

// Renders its children at RootPortalProvider's host, above the navigators.
export const RootPortal = ({ children }: { children: ReactNode }) => {
  const { addPortal, removePortal } = useRootPortalHost()
  const name = useId()

  useEffect(() => {
    addPortal(name, children)
  }, [addPortal, name, children])

  useEffect(() => () => removePortal(name), [removePortal, name])

  return null
}
