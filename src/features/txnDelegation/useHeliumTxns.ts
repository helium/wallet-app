import { AddGateway, Location, Transfer } from '@helium/react-native-sdk'
import { SignHotspotResponse } from '@helium/wallet-link'
import { useCallback, useMemo } from 'react'
import { getKeypair } from '@storage/secureStorage'
import { useSubmitTxnMutation } from '../../generated/graphql'

const useHeliumTxns = (
  heliumAddress: string,
  opts: {
    addGatewayTxn?: string
    assertLocationTxn?: string
    transferHotspotTxn?: string
  },
) => {
  const [submitTxnMutation, { loading: submitLoading }] = useSubmitTxnMutation()

  const addGatewayTxn = useMemo(() => {
    if (!opts.addGatewayTxn) return

    return AddGateway.txnFromString(opts.addGatewayTxn)
  }, [opts.addGatewayTxn])

  const assertLocationTxn = useMemo(() => {
    if (!opts.assertLocationTxn) return
    return Location.txnFromString(opts.assertLocationTxn)
  }, [opts.assertLocationTxn])

  const transferHotspotTxn = useMemo(() => {
    if (!opts.transferHotspotTxn) return

    return Transfer.txnFromString(opts.transferHotspotTxn)
  }, [opts.transferHotspotTxn])

  const gatewayAddress = useMemo(() => {
    return (
      addGatewayTxn?.gateway?.b58 ||
      assertLocationTxn?.gateway?.b58 ||
      transferHotspotTxn?.gateway?.b58
    )
  }, [addGatewayTxn, assertLocationTxn, transferHotspotTxn])

  const hasTransactions = useMemo(() => !!gatewayAddress, [gatewayAddress])

  const submit = useCallback(() => {
    // TODO: Confirm this works
    const txnObject = assertLocationTxn || transferHotspotTxn
    if (!txnObject) return
    return submitTxnMutation({
      variables: {
        address: heliumAddress,
        txn: txnObject?.toString(),
        txnJson: JSON.stringify(txnObject),
      },
    })
  }, [assertLocationTxn, heliumAddress, submitTxnMutation, transferHotspotTxn])

  const sign = useCallback(
    async (
      callback: (responseParams: SignHotspotResponse) => Promise<void>,
    ) => {
      try {
        const ownerKeypair = await getKeypair(heliumAddress || '')

        const responseParams = {
          status: 'success',
          gatewayAddress,
        } as SignHotspotResponse

        if (addGatewayTxn) {
          const txnOwnerSigned = await addGatewayTxn.sign({
            owner: ownerKeypair,
          })

          if (!txnOwnerSigned.gateway?.b58) {
            callback({ status: 'gateway_not_found' })
            throw new Error('Failed to sign gateway txn')
          }

          responseParams.gatewayTxn = txnOwnerSigned.toString()
        }

        if (assertLocationTxn && assertLocationTxn.gateway?.b58) {
          const ownerIsPayer =
            assertLocationTxn.payer?.b58 === assertLocationTxn.owner?.b58
          const txnOwnerSigned = await assertLocationTxn.sign({
            owner: ownerKeypair,
            payer: ownerIsPayer ? ownerKeypair : undefined,
          })
          responseParams.assertTxn = txnOwnerSigned.toString()
        }

        if (transferHotspotTxn) {
          if (!ownerKeypair) {
            callback({ status: 'token_not_found' })
            throw new Error('Failed to sign transfer txn')
          }

          const txnTransferSigned = await transferHotspotTxn.sign({
            owner: ownerKeypair,
          })

          if (!txnTransferSigned.gateway?.b58) {
            callback({ status: 'gateway_not_found' })
            throw new Error('Failed to sign transfer txn')
          }

          responseParams.transferTxn = txnTransferSigned.toString()
        }

        callback(responseParams)
      } catch (e) {
        // Logger.error(e)
      }
    },
    [
      addGatewayTxn,
      assertLocationTxn,
      gatewayAddress,
      heliumAddress,
      transferHotspotTxn,
    ],
  )

  return {
    addGatewayTxn,
    assertLocationTxn,
    transferHotspotTxn,
    gatewayAddress,
    sign,
    hasTransactions,
    submit,
    submitLoading,
  }
}

export default useHeliumTxns
