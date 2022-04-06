import { PaymentV1, TokenBurnV1 } from '@helium/transactions'
import AppHelium from '@ledgerhq/hw-app-helium'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { useCallback, useState } from 'react'
import useDisappear from './useDisappear'

const mainNetPath = "44'/904'/0'/0/0" // HD derivation path

export const getLedgerAddress = async (transport: TransportBLE) => {
  const helium = new AppHelium(transport)
  const { address } = await helium.getAddress(mainNetPath, true, 0)
  return address
}

export const signLedgerPayment = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transport: TransportBLE,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  paymentV1: PaymentV1,
) => {
  // TODO: Bring this back when payment support is merged into ledger sdk
  // const helium = new AppHelium(transport)
  // const { txn } = await helium.signPaymentV1(paymentV1, 0)
  // return txn
}

export const signLedgerBurn = async (
  transport: TransportBLE,
  burnV1: TokenBurnV1,
) => {
  const helium = new AppHelium(transport)
  const { txn } = await helium.signTokenBurnV1(burnV1, 0)
  return txn
}

export const useLedger = () => {
  const [transport, setTransport] =
    useState<{ transport: TransportBLE; deviceId: string }>()

  const getTransport = useCallback(
    async (nextDeviceId: string) => {
      if (transport?.deviceId === nextDeviceId) {
        return transport
      }

      const newTransport = await TransportBLE.open(nextDeviceId)
      newTransport.on('disconnect', () => {
        // Intentionally for the sake of simplicity we use a transport local state
        // and remove it on disconnect.
        // A better way is to pass in the device.id and handle the connection internally.
        setTransport(undefined)
      })
      setTransport({ transport: newTransport, deviceId: nextDeviceId })

      return newTransport
    },
    [transport],
  )

  useDisappear(() => {
    transport?.transport.close()
    setTransport(undefined)
  })

  return { transport, getTransport }
}
