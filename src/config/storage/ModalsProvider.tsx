/* eslint-disable @typescript-eslint/no-shadow */
import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react'

interface IModalProps {
  type?: 'InsufficientSolConversion'

  onHide?: () => Promise<void>
  onCancel?: () => Promise<void>
  onError?: () => Promise<void>
  onSuccess?: () => Promise<void>
}

export interface IModalContextState extends IModalProps {
  showModal: (modalProps: IModalProps) => void
  hideModal: () => void
}

const ModalContext = createContext<IModalContextState>({} as IModalContextState)

const ModalProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [modalProps, setModalProps] = useState<IModalProps>()

  const reset = useCallback(() => {
    setModalProps(undefined)
  }, [])

  const hideModal = useCallback(() => {
    reset()
  }, [reset])

  const showModal = useCallback((modalProps: IModalProps) => {
    setModalProps(modalProps)
  }, [])

  return (
    <ModalContext.Provider value={{ ...modalProps, hideModal, showModal }}>
      {children}
    </ModalContext.Provider>
  )
}

const useModal = () => {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

export { ModalProvider, useModal }
