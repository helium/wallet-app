import { PaymentV2, TokenBurnV1 } from '@helium/transactions'
import AppHelium from '@ledgerhq/hw-app-helium'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import TransportHID from '@ledgerhq/react-native-hid'
import { useCallback, useState } from 'react'
import useDisappear from './useDisappear'

const mainNetPath = "44'/904'/0'/0/0" // HD derivation path

export const getLedgerAddress = async (
  transport: TransportBLE | TransportHID,
) => {
  const helium = new AppHelium(transport)
  const { address } = await helium.getAddress(mainNetPath, true, 0)
  return address
}

export const signLedgerPayment = async (
  transport: TransportBLE | TransportHID,
  paymentV2: PaymentV2,
) => {
  const helium = new AppHelium(transport)
  const { txn } = await helium.signPaymentV2(paymentV2, 0)
  return txn
}

export const signLedgerBurn = async (
  transport: TransportBLE | TransportHID,
  burnV1: TokenBurnV1,
) => {
  const helium = new AppHelium(transport)
  return helium.signTokenBurnV1(burnV1, 0)
}

export const useLedger = () => {
  const [transport, setTransport] = useState<{
    transport: TransportBLE | TransportHID
    deviceId: string
  }>()

  const getTransport = useCallback(
    async (nextDeviceId: string, type: 'usb' | 'bluetooth') => {
      if (transport?.deviceId === nextDeviceId) {
        return transport.transport
      }

      let newTransport: TransportBLE | TransportHID | null = null
      if (type === 'usb') {
        await TransportHID.create()
        const devices = await TransportHID.list()
        const device = devices.find(
          (d) => d.deviceId === parseInt(nextDeviceId, 10),
        )
        if (!device) return
        newTransport = await TransportHID.open(device)
      } else {
        newTransport = await TransportBLE.open(nextDeviceId)
      }
      if (!newTransport) return

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
