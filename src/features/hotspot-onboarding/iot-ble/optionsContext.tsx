import React, { useContext } from 'react'
import { IotBleOptions } from '../navTypes'

const IotBleOptionsContext = React.createContext<IotBleOptions>({})

export const useIotBleOptions = () => {
  return useContext(IotBleOptionsContext)
}

export const IotBleOptionsProvider = ({
  value,
  children,
}: {
  value: IotBleOptions
  children: React.ReactNode
}) => {
  return (
    <IotBleOptionsContext.Provider value={value}>
      {children}
    </IotBleOptionsContext.Provider>
  )
}
