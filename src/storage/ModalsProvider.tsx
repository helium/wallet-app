import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react'

export type Modals = 'InsufficientSolConversion'

export interface IModalProviderProps {
  children: ReactNode
}

export interface IModalContextState {
  modalType: undefined | Modals

  showModal: (modalType: Modals) => void
  hideModal: () => void
}

const ModalContext = createContext<IModalContextState>({} as IModalContextState)

const ModalProvider: FC<IModalProviderProps> = ({ children }) => {
  const [modalType, setModalType] = useState<Modals | undefined>()

  const hideModal = useCallback(() => setModalType(undefined), [setModalType])
  const showModal = useCallback(
    (type: Modals) => setModalType(type),
    [setModalType],
  )

  return (
    <ModalContext.Provider value={{ modalType, showModal, hideModal }}>
      {children}
    </ModalContext.Provider>
  )
}

const useModal = () => {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within a DrawerProvider')
  }
  return context
}

export { ModalProvider, useModal }
