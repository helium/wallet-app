import { useOwnedAmount } from '@helium/helium-react-hooks'
import { DC_MINT } from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useSubmitAndAwait } from '@hooks/useSubmitAndAwait'
import { useBalance } from '@utils/Balance'
import { humanReadable } from '@utils/formatting'
import BN from 'bn.js'
import { Buffer } from 'buffer'
import React from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { MessagePreview } from '../solana/MessagePreview'
import { useSolana } from '../solana/SolanaProvider'
import { useWalletSign } from '../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../solana/walletSignBottomSheetTypes'
import { useBlockchainApi } from '../storage/BlockchainApiProvider'

export function useImplicitBurn(): {
  implicitBurn: (requiredDc: number) => void
  loading: boolean
  error?: Error
} {
  const { anchorProvider } = useSolana()
  const { walletSignBottomSheetRef } = useWalletSign()
  const { dcToNetworkTokens } = useBalance()
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const { amount: myDc, loading: loadingDc } = useOwnedAmount(wallet, DC_MINT)
  const { submitAndAwait } = useSubmitAndAwait()
  const client = useBlockchainApi()

  const {
    execute: implicitBurn,
    loading,
    error,
  } = useAsyncCallback(async (totalDcReq: number) => {
    if (!anchorProvider) throw new Error('No anchor provider')
    if (loadingDc) throw new Error('Still loading balances')
    if (!wallet) throw new Error('No wallet')

    if ((myDc || BigInt(0)) < BigInt(totalDcReq)) {
      const dcDeficit = BigInt(totalDcReq) - (myDc || BigInt(0))
      const hntAmount = dcToNetworkTokens(new BN(dcDeficit.toString()))
      const ownerAddress = wallet.toBase58()

      const transactionData = await client.dataCredits.mint({
        owner: ownerAddress,
        dcAmount: dcDeficit.toString(),
        recipient: ownerAddress,
      })

      if (!walletSignBottomSheetRef) {
        throw new Error('No wallet bottom sheet')
      }

      const serializedTxs = transactionData.transactions.map((tx) =>
        Buffer.from(tx.serializedTransaction, 'base64'),
      )

      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        serializedTxs,
        header: t('transactions.buyDc'),
        message: t('transactions.signMintDataCreditsTxn'),
        renderer: () => (
          <MessagePreview
            message={t('transactions.signMintDataCreditsTxnPreview', {
              hntAmount: humanReadable(hntAmount, 8),
              dcAmount: humanReadable(new BN(dcDeficit.toString()), 0),
            })}
          />
        ),
      })
      if (decision) {
        // This will await completion and handle blockhash expiration with retry
        await submitAndAwait({
          transactionData,
          onNeedsResign: async () => {
            return client.dataCredits.mint({
              owner: ownerAddress,
              dcAmount: dcDeficit.toString(),
              recipient: ownerAddress,
            })
          },
        })
      } else {
        throw new Error('User rejected transaction')
      }
    }
  })

  return {
    implicitBurn,
    loading,
    error,
  }
}
