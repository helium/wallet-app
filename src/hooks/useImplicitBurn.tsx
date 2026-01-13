import { Program } from '@coral-xyz/anchor'
import {
  init as initDataCredits,
  mintDataCredits,
} from '@helium/data-credits-sdk'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { DataCredits } from '@helium/idls/lib/types/data_credits'
import { DC_MINT } from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useSubmitAndAwait } from '@hooks/useSubmitAndAwait'
import { useBalance } from '@utils/Balance'
import { humanReadable } from '@utils/formatting'
import { toTransactionData } from '@utils/transactionUtils'
import BN from 'bn.js'
import { Buffer } from 'buffer'
import React from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { MessagePreview } from '../solana/MessagePreview'
import { useSolana } from '../solana/SolanaProvider'
import { useWalletSign } from '../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../solana/walletSignBottomSheetTypes'

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

  const {
    execute: implicitBurn,
    loading,
    error,
  } = useAsyncCallback(async (totalDcReq: number) => {
    if (!anchorProvider) throw new Error('No anchor provider')
    if (loadingDc) throw new Error('Still loading balances')
    if (!wallet) throw new Error('No wallet')

    if ((myDc || BigInt(0)) < BigInt(totalDcReq)) {
      const program = (await initDataCredits(
        anchorProvider,
      )) as unknown as Program<DataCredits>
      const dcDeficit = BigInt(totalDcReq) - (myDc || BigInt(0))
      const hntAmount = dcToNetworkTokens(new BN(dcDeficit.toString()))

      const { txs } = await mintDataCredits({
        dcAmount: new BN(dcDeficit.toString()),
        dcMint: DC_MINT,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        program,
        recipient: wallet,
      })
      if (!walletSignBottomSheetRef) {
        throw new Error('No wallet bottom sheet')
      }
      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        serializedTxs: txs.map(({ tx }) => Buffer.from(tx.serialize())),
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
        const transactionData = toTransactionData(
          txs.map(({ tx }) => tx),
          {
            tag: 'implicit-burn',
            metadata: { type: 'mint', description: 'Implicit DC Burn' },
          },
        )
        // This will await completion and handle blockhash expiration with retry
        await submitAndAwait({
          transactionData,
          onNeedsResign: async () => {
            const { txs: freshTxs } = await mintDataCredits({
              dcAmount: new BN(dcDeficit.toString()),
              dcMint: DC_MINT,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              program,
              recipient: wallet,
            })
            return toTransactionData(
              freshTxs.map(({ tx }) => tx),
              {
                tag: 'implicit-burn',
                metadata: { type: 'mint', description: 'Implicit DC Burn' },
              },
            )
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
